import fs from 'fs/promises'
import crypto from 'crypto'
import { parse, preprocess } from 'svelte/compiler'
import MagicString from 'magic-string'

main()

async function main() {
  const input = await fs.readFile('./TestInput.svelte', { encoding: 'utf-8' })

  const { code } = await preprocess(input, jsInCss())

  await fs.writeFile('./TestOutput.svelte', code)
}

function jsInCss() {
  return {
    async markup({ content, filename }) {
      const ast = parse(content)

      if (ast.css == null) return { code: content }

      const s = new MagicString(content)
      const cssContent = content.slice(ast.css.start, ast.css.end)
      const jsExpressions = new Map()

      const jsFunctionRegex = /js\((.*?)\)/g
      let match
      while ((match = jsFunctionRegex.exec(cssContent))) {
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
  return crypto.createHash('md5').update(input).digest('base64').substring(0, 6)
}
