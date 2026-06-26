import { useMemo, useRef, useState } from 'react';
import { buildSrcdoc } from '../runtime/sandbox';
import { useAutoFrameHeight } from '../runtime/useAutoFrameHeight';
import type { BlockDef, BlockRenderProps, BlockEditProps } from './types';

interface PlayProps { html: string; css: string; js: string; showEditor: boolean }

// Live code playground: viewers edit HTML/CSS/JS and see the sandboxed result
// update on "실행". Editable in present mode too (that's the point).
function Render({ block, fillHeight }: BlockRenderProps) {
  const p = block.props as unknown as PlayProps;
  const [html, setHtml] = useState(p.html);
  const [css, setCss] = useState(p.css);
  const [js, setJs] = useState(p.js);
  const [runKey, setRunKey] = useState(0);
  const srcdoc = useMemo(() => buildSrcdoc(html, css, js), [runKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const [tab, setTab] = useState<'html' | 'css' | 'js'>('html');
  const frameRef = useRef<HTMLIFrameElement>(null);
  const frameH = useAutoFrameHeight(frameRef);

  const val = tab === 'html' ? html : tab === 'css' ? css : js;
  const setVal = (v: string) => (tab === 'html' ? setHtml(v) : tab === 'css' ? setCss(v) : setJs(v));

  return (
    <div className={`playground ${p.showEditor ? 'with-editor' : ''}`}>
      {p.showEditor && (
        <div className="pg-editor">
          <div className="pg-tabs">
            {(['html', 'css', 'js'] as const).map((t) => (
              <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t.toUpperCase()}</button>
            ))}
            <button className="pg-run" onClick={() => setRunKey((k) => k + 1)}>▶ 실행</button>
          </div>
          <textarea className="mono" value={val} onChange={(e) => setVal(e.target.value)} spellCheck={false} />
        </div>
      )}
      <iframe ref={frameRef} className="pg-preview" title={block.id} sandbox="allow-scripts" srcDoc={srcdoc} style={fillHeight ? { height: '100%' } : frameH ? { height: frameH } : undefined} />
    </div>
  );
}

function Edit({ block, update }: BlockEditProps) {
  const p = block.props as unknown as PlayProps;
  return (
    <>
      {(['html', 'css', 'js'] as const).map((k) => (
        <label key={k} className="field col"><span>{k.toUpperCase()}</span>
          <textarea className="mono" rows={5} value={String(p[k] ?? '')} onChange={(e) => update({ [k]: e.target.value })} spellCheck={false} />
        </label>
      ))}
      <label className="field"><span>에디터 표시</span>
        <input type="checkbox" checked={p.showEditor} onChange={(e) => update({ showEditor: e.target.checked })} />
      </label>
    </>
  );
}

export const playgroundBlock: BlockDef = { type: 'playground', label: '플레이그라운드', icon: '⚡', Render, Edit, fill: true };
