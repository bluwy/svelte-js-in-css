<script>
  let num = 10
  let bg = 'red'
</script>

<main>
  <div>Hello</div>
</main>

<style lang="postcss">
  main {
    background-color: js(bg);

    div {
      width: js(num + 'px');
      overflow: hidden;
    }
  }
</style>
