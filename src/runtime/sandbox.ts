// Build an iframe srcdoc that runs user HTML/CSS/JS in isolation.
// Used by the `playground` and `customCode` blocks. The iframe is rendered with
// sandbox="allow-scripts" so it cannot touch the parent document.
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
</body></html>`;
}
