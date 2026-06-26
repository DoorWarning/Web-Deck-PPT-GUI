// Build an iframe srcdoc that runs user HTML/CSS/JS in isolation.
// Used by the `playground` and `customCode` blocks. The iframe is rendered with
// sandbox="allow-scripts" so it cannot touch the parent document.
//
// A small reporter posts the document's content height to the parent on load and
// whenever it changes, so the host can size the iframe to fit (see
// useAutoFrameHeight). The message is tagged `__deckFrame` and matched by
// event.source on the parent side. Origin is null (sandboxed), so we post to '*'.
export function buildSrcdoc(html: string, css: string, js: string): string {
  return `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;padding:12px;font-family:system-ui,sans-serif}${css}</style>
</head><body>
${html}
<script>
try {
${js}
} catch (e) { document.body.insertAdjacentHTML('beforeend', '<pre style="color:crimson">'+e+'</pre>'); }
<\/script>
<script>
(function () {
  function post() {
    try { parent.postMessage({ __deckFrame: 1, h: Math.ceil(document.body.scrollHeight) }, '*'); } catch (e) {}
  }
  addEventListener('load', post);
  setTimeout(post, 0);
  if (window.ResizeObserver) new ResizeObserver(post).observe(document.body);
})();
<\/script>
</body></html>`;
}
