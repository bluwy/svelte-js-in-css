const fs = require('fs/promises')
const crypto = require('crypto')
const { parse, preprocess } = require('svelte/compiler')
const { less, postcss, sass, scss, stylus } = require('svelte-preprocess')
const { asMarkupPreprocessor } = require('svelte-as-markup-preprocessor')
const MagicString = require('magic-string')

const TEST_BACKTICK_SYNTAX = process.argv.includes('--backtick')
const QUIET_LOG = process.argv.includes('--quiet')

testInput('Css')
testInput('Less', [less()])
testInput('Sass', [sass()])
testInput('Scss', [scss()])
testInput('Stylus', [stylus()])
testInput('Postcss', [postcss({ plugins: [require('postcss-nested')] })])
// prettier-ignore
testInput('Sugarss', [postcss({ parser: require('sugarss'), plugins: [], stripIndent: true })])

async function testInput(name, preprocessors = []) {
  try {
    const inputFilePath = `./tests/${name}Input.svelte`
    const outputFilePath = `./tests/${name}Output.svelte`

    let input = await fs.readFile(inputFilePath, { encoding: 'utf-8' })

    if (TEST_BACKTICK_SYNTAX) {
      input = input.replace(/js\((.*?)\)/g, `\`$1\``)
    }

    const { code } = await preprocess(
      input,
      [asMarkupPreprocessor(preprocessors), jsInCss()],
      { filename: inputFilePath }
    )

    await fs.writeFile(outputFilePath, code)
  } catch (e) {
    console.log(`${name} is not happy`)
    if (!QUIET_LOG) {
      console.log(e)
    }
  }
}

function jsInCss() {
  return {
    async markup({ content, filename }) {
      const ast = parse(content)

      if (ast.css == null) return { code: content }

      const s = new MagicString(content)
      const cssContent = content.slice(ast.css.start, ast.css.end)
      const jsExpressions = new Map()

      const re = TEST_BACKTICK_SYNTAX ? /`(.*?)`/g : /js\((.*?)\)/g
      let match
      while ((match = re.exec(cssContent))) {
        const jsHash = hash(match[1] + filename)
        jsExpressions.set(jsHash, match[1])
        // Rename to "js(a + b)" => "var(--abc123)"
        s.overwrite(
          ast.css.start + match.index,
          ast.css.start + match.index + match[0].length,
          `var(--${jsHash})`
        )
      }

      if (jsExpressions.length <= 0) return { code: content }

      let style = ''
      jsExpressions.forEach((v, k) => {
        style += `--${k}: {${v}}; `
      })

      s.appendRight(
        ast.html.start,
        `<div style="display: contents; ${style}">\n`
      )
      s.appendLeft(ast.html.end, `\n</div>`)

      return { code: s.toString(), map: s.generateMap() }
    },
  }
}

function hash(input = '') {
  return crypto
    .createHash('md5')
    .update(input)
    .digest('base64')
    .replace(/(\+|\/|\=)/g, '')
    .substring(0, 6)
}
