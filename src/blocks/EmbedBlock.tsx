import type { BlockDef, BlockRenderProps, BlockEditProps } from './types';

interface EmbedProps { url: string; ratio: string }

function Render({ block }: BlockRenderProps) {
  const p = block.props as unknown as EmbedProps;
  return (
    <div className="embed-block" style={{ aspectRatio: p.ratio || '16/9' }}>
      {p.url ? (
        <iframe
          src={p.url}
          title={block.id}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
          allowFullScreen
          style={{ width: '100%', height: '100%', border: 0, borderRadius: 12 }}
        />
      ) : (
        <div className="media-placeholder">임베드 URL을 입력하세요</div>
      )}
    </div>
  );
}

function Edit({ block, update }: BlockEditProps) {
  const p = block.props as unknown as EmbedProps;
  return (
    <>
      <label className="field col"><span>URL</span>
        <input value={p.url} onChange={(e) => update({ url: e.target.value })} placeholder="https://..." />
      </label>
      <label className="field"><span>비율</span>
        <select value={p.ratio} onChange={(e) => update({ ratio: e.target.value })}>
          <option value="16/9">16:9</option>
          <option value="4/3">4:3</option>
          <option value="1/1">1:1</option>
          <option value="21/9">21:9</option>
        </select>
      </label>
    </>
  );
}

export const embedBlock: BlockDef = { type: 'embed', label: '임베드', icon: '🔗', Render, Edit };
