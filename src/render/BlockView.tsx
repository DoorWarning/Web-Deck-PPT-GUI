import { useRef, useState, useLayoutEffect } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { Block } from '../model/types';
import { getBlockDef } from '../blocks/registry';
import { useStore } from '../store/store';

export interface SnapGuides { x?: number; y?: number }

// Renders block content at a constant design width and uniformly scales it to
// fill the box (transform). The outer height tracks the scaled content height so
// the box outline always matches what's shown. Used for free (absolute) blocks
// so resizing actually grows/shrinks the content, not just the frame.
function ScaledContent({ scale, children }: { scale: number; children: ReactNode }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(0);
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const update = () => setH(el.scrollHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div style={{ width: '100%', height: h ? h * scale : undefined, overflow: 'hidden' }}>
      <div ref={innerRef} style={{ width: `${100 / scale}%`, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </div>
  );
}

interface Props {
  block: Block;
  mode: 'edit' | 'present';
  selected?: boolean;          // edit: highlight
  onSelect?: () => void;       // edit: select on click
  hiddenOverride?: boolean;    // present: runtime toggleBlock state
  onClick?: () => void;        // present: run click interactions
  onGuides?: (g: SnapGuides) => void; // edit: report active alignment guides
  vars?: Record<string, unknown>;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const round1 = (n: number) => Math.round(n * 10) / 10;
const SNAP = 2.2; // snap threshold in %

type Dir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
const HANDLE_DIRS: Dir[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

// Wraps a block's visual renderer with layout (flow or absolute), drag-to-move
// with alignment snapping, per-block typography, reveal, selection and clicks.
export function BlockView({ block, mode, selected, onSelect, hiddenOverride, onClick, onGuides, vars }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const def = getBlockDef(block.type);
  const updateBlock = useStore((s) => s.updateBlock);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const resize = useRef<{ dir: Dir; sx: number; sy: number; ox: number; oy: number; ow: number; oh: number; base: number } | null>(null);

  const L = block.layout;
  const isAbsolute = L.position === 'absolute';
  // Uniform content scale for free blocks: current width vs. reference width.
  const baseW = L.baseWidthPct ?? L.widthPct ?? 40;
  const scale = isAbsolute ? Math.max(0.05, (L.widthPct ?? 40) / baseW) : 1;
  const hidden = hiddenOverride ?? block.hidden;
  const clickable = mode === 'present' && block.interactions.some((i) => i.on === 'click');
  const draggable = mode === 'edit' && isAbsolute && !drag.current;
  // Stepped blocks become reveal.js fragments in present mode.
  const fragment = mode === 'present' && (block.anim.step ?? 0) > 0;
  const fragmentAnim = ({ fade: 'fade-in', rise: 'fade-up', zoom: 'zoom-in', none: 'fade-in' } as const)[block.anim.reveal ?? 'fade'];

  // ----- drag to move (edit + absolute), with alignment snapping -----
  // In edit mode block content is pointer-events:none (see CSS), so the whole
  // block is one drag/select surface — grab anywhere, no interactive guard.
  const onPointerDown = (e: React.PointerEvent) => {
    if (mode !== 'edit') { if (clickable) onClick?.(); return; }
    e.stopPropagation();
    onSelect?.();
    if (!isAbsolute || e.button !== 0) return;
    const section = ref.current?.closest('.section') as HTMLElement | null;
    if (!section) return;
    drag.current = { x: e.clientX, y: e.clientY, ox: L.xPct ?? 0, oy: L.yPct ?? 0 };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !ref.current) return;
    const section = ref.current.closest('.section') as HTMLElement | null;
    if (!section) return;
    const sr = section.getBoundingClientRect();
    const br = ref.current.getBoundingClientRect();
    const bw = (br.width / sr.width) * 100;
    const bh = (br.height / sr.height) * 100;
    let xPct = clamp(d.ox + ((e.clientX - d.x) / sr.width) * 100, 0, 100);
    let yPct = clamp(d.oy + ((e.clientY - d.y) / sr.height) * 100, 0, 100);

    // Snap left/center/right and top/middle/bottom relative to the section.
    const g: SnapGuides = {};
    for (const [val, line] of [[0, 0], [(100 - bw) / 2, 50], [100 - bw, 100]] as const) {
      if (Math.abs(xPct - val) < SNAP) { xPct = val; g.x = line; break; }
    }
    for (const [val, line] of [[0, 0], [(100 - bh) / 2, 50], [100 - bh, 100]] as const) {
      if (Math.abs(yPct - val) < SNAP) { yPct = val; g.y = line; break; }
    }
    onGuides?.(g);
    updateBlock(block.id, { layout: { ...L, xPct: round1(xPct), yPct: round1(yPct) } }, true);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag.current) return;
    drag.current = null;
    onGuides?.({});
    const cur = useStore.getState().deck.sections[useStore.getState().currentSection].blocks.find((b) => b.id === block.id);
    if (cur) updateBlock(block.id, { layout: cur.layout }, false);
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* */ }
  };

  // ----- resize via edge/corner handles (edit + absolute) -----
  // Resizing changes widthPct (= uniform scale vs. baseWidthPct); content scales
  // with it. Vertical drags map to scale via aspect. The block's CENTER stays
  // fixed (grows/shrinks symmetrically).
  const ASPECT = 1280 / 720;
  const startResize = (e: React.PointerEvent, dir: Dir) => {
    e.stopPropagation();
    e.preventDefault();
    const section = ref.current?.closest('.section') as HTMLElement | null;
    if (!section || !ref.current) return;
    const sr = section.getBoundingClientRect();
    const br = ref.current.getBoundingClientRect();
    resize.current = {
      dir, sx: e.clientX, sy: e.clientY,
      ox: L.xPct ?? 0, oy: L.yPct ?? 0,
      ow: L.widthPct ?? 40, oh: (br.height / sr.height) * 100,
      base: baseW,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const moveResize = (e: React.PointerEvent) => {
    const r = resize.current;
    if (!r || !ref.current) return;
    const section = ref.current.closest('.section') as HTMLElement | null;
    if (!section) return;
    const sr = section.getBoundingClientRect();
    const dx = ((e.clientX - r.sx) / sr.width) * 100;
    const dy = ((e.clientY - r.sy) / sr.height) * 100;
    // Symmetric (center-anchored): outward drag on either side grows equally.
    let dW = 0;
    if (r.dir.includes('e')) dW += dx;
    if (r.dir.includes('w')) dW -= dx;
    if (r.dir.includes('s')) dW += dy * ASPECT;
    if (r.dir.includes('n')) dW -= dy * ASPECT;
    const newW = clamp(r.ow + 2 * dW, 4, 100); // ×2: both sides move from center
    const ratio = newW / r.ow;
    const newH = r.oh * ratio;
    const cx = r.ox + r.ow / 2;
    const cy = r.oy + r.oh / 2;
    const patch = {
      ...L,
      position: 'absolute' as const,
      widthPct: round1(newW),
      baseWidthPct: round1(r.base),
      xPct: round1(clamp(cx - newW / 2, -100, 100)),
      yPct: round1(clamp(cy - newH / 2, -100, 100)),
    };
    updateBlock(block.id, { layout: patch }, true);
  };
  const endResize = (e: React.PointerEvent) => {
    if (!resize.current) return;
    resize.current = null;
    const cur = useStore.getState().deck.sections[useStore.getState().currentSection].blocks.find((b) => b.id === block.id);
    if (cur) updateBlock(block.id, { layout: cur.layout }, false);
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* */ }
  };
  const showHandles = mode === 'edit' && isAbsolute && !!selected;

  // ----- style -----
  const usePreset = L.widthPct == null && !isAbsolute;
  const style: CSSProperties = {};
  if (isAbsolute) {
    style.position = 'absolute';
    style.left = `${L.xPct ?? 0}%`;
    style.top = `${L.yPct ?? 0}%`;
    style.width = `${L.widthPct ?? 40}%`;
    style.zIndex = L.z ?? 1;
  } else if (L.widthPct != null) {
    style.maxWidth = `${L.widthPct}%`;
  }
  if (block.style?.fontFamily) style.fontFamily = block.style.fontFamily;
  if (block.style?.color) style.color = block.style.color;
  if (block.style?.fontSize) style.fontSize = block.style.fontSize;
  if (block.style?.textAlign) style.textAlign = block.style.textAlign;
  if (hidden) { style.opacity = 0; style.pointerEvents = 'none'; }
  if (!isAbsolute && L.col) style.gridColumn = `span ${L.col}`;

  const classes = [
    'block',
    isAbsolute ? 'pos-absolute' : 'pos-flow',
    usePreset ? `w-${L.width ?? 'auto'}` : '',
    `align-${L.align ?? 'center'}`,
    fragment ? `fragment ${fragmentAnim}` : '',
    selected ? 'selected' : '',
    clickable ? 'clickable' : '',
    draggable ? 'draggable' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={ref}
      data-block-id={block.id}
      className={classes}
      style={style}
      {...(fragment ? { 'data-fragment-index': block.anim.step } : {})}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="block-content">
        {isAbsolute ? (
          <ScaledContent scale={scale}>
            <def.Render block={block} mode={mode} vars={vars} />
          </ScaledContent>
        ) : (
          <def.Render block={block} mode={mode} vars={vars} />
        )}
      </div>
      {showHandles && HANDLE_DIRS.map((dir) => (
        <div
          key={dir}
          className={`rz rz-${dir}`}
          onPointerDown={(e) => startResize(e, dir)}
          onPointerMove={moveResize}
          onPointerUp={endResize}
        />
      ))}
    </div>
  );
}
