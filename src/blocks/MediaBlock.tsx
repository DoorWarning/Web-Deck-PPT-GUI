import type { BlockDef, BlockRenderProps, BlockEditProps } from './types';

function Render({ block }: BlockRenderProps) {
  const { kind, src, alt, caption } = block.props as { kind: string; src: string; alt: string; caption: string };
  return (
    <figure className="media-block">
      {!src ? (
        <div className="media-placeholder">미디어 (속성 패널에서 URL/업로드)</div>
      ) : kind === 'video' ? (
        <video src={src} controls style={{ width: '100%', borderRadius: 12 }} />
      ) : (
        <img src={src} alt={alt} style={{ width: '100%', borderRadius: 12, display: 'block' }} />
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function Edit({ block, update }: BlockEditProps) {
  const p = block.props as { kind: string; src: string; alt: string; caption: string };
  const onFile = (file: File) => {
    const r = new FileReader();
    r.onload = () => update({ src: String(r.result) });
    r.readAsDataURL(file);
  };
  return (
    <>
      <label className="field">
        <span>종류</span>
        <select value={p.kind} onChange={(e) => update({ kind: e.target.value })}>
          <option value="image">이미지</option>
          <option value="video">비디오</option>
        </select>
      </label>
      <label className="field col">
        <span>URL</span>
        <input value={p.src.startsWith('data:') ? '(업로드됨)' : p.src} onChange={(e) => update({ src: e.target.value })} placeholder="https://..." />
      </label>
      <label className="file-btn">
        파일 업로드
        <input type="file" accept="image/*,video/*" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      </label>
      <label className="field col">
        <span>캡션</span>
        <input value={p.caption} onChange={(e) => update({ caption: e.target.value })} />
      </label>
    </>
  );
}

export const mediaBlock: BlockDef = { type: 'media', label: '미디어', icon: '🖼️', Render, Edit };
