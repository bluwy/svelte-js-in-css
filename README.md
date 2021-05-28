# Svelte JS in CSS

When CSS plays uno reverse.

For RFC: https://github.com/sveltejs/rfcs/pull/51

> **This project is an experiment**. No npm packages published at the moment.

## Idea

Use JS directly in the `<style>` tag:

```svelte
<script>
  let num = 10
</script>

<div>Hello</div>

<style>
  div {
    width: js(num + 'px');
    overflow: hidden;
  }
</style>
```

Preprocesses to:

```svelte
<script>
  let num = 10
</script>

<div style="display: contents; --naVbV1: {num + 'px'}; ">
<div>Hello</div>
</div>

<style>
  div {
    width: var(--naVbV1);
    overflow: hidden;
  }
</style>
```

## Development

```bash
$ node main.js

# Only report failed css types, no error logs
$ node main.js --queit

# Test backtick syntax
$ node main.js --backtick
```

## Caveats

1. Hashing function is not the same as Svelte's `cssHash` option.

2. A wrapping content with `display: contents` is used since it's easier to implement.

> These caveats could be overcomed if this feature is built into Svelte.

## License

MIT
