import { useMemo } from 'react';
import { buildSrcdoc } from '../runtime/sandbox';
import type { BlockDef, BlockRenderProps, BlockEditProps } from './types';

interface CodeProps { html: string; css: string; js: string }

// The hybrid escape hatch: author drops raw HTML/CSS/JS that runs sandboxed.
// Unlike playground, no live editor is shown to the viewer — it just renders.
function Render({ block }: BlockRenderProps) {
  const p = block.props as unknown as CodeProps;
  const srcdoc = useMemo(() => buildSrcdoc(p.html, p.css, p.js), [p.html, p.css, p.js]);
  return (
    <iframe
      className="customcode-frame"
      data-autosize
      title={block.id}
      sandbox="allow-scripts"
      srcDoc={srcdoc}
      style={{ width: '100%', minHeight: 120, border: 0 }}
    />
  );
}

function Edit({ block, update }: BlockEditProps) {
  const p = block.props as unknown as CodeProps;
  return (
    <>
      {(['html', 'css', 'js'] as const).map((k) => (
        <label key={k} className="field col"><span>{k.toUpperCase()}</span>
          <textarea className="mono" rows={6} value={String(p[k] ?? '')} onChange={(e) => update({ [k]: e.target.value })} spellCheck={false} />
        </label>
      ))}
    </>
  );
}

export const customCodeBlock: BlockDef = { type: 'customCode', label: '커스텀 코드', icon: '</>', Render, Edit };
