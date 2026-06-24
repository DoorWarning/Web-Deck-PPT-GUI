import { useRef } from 'react';
import type { CSSProperties } from 'react';
import type { Block } from '../model/types';
import { getBlockDef } from '../blocks/registry';
import { useStore } from '../store/store';
import { useInView } from './useInView';

export interface SnapGuides { x?: number; y?: number }

interface Props {
  block: Block;
  mode: 'edit' | 'present';
  selected?: boolean;          // edit: highlight
  onSelect?: () => void;       // edit: select on click
  visibleStep?: number;        // present: highest revealed fragment step
  hiddenOverride?: boolean;    // present: runtime toggleBlock state
  onClick?: () => void;        // present: run click interactions
  onGuides?: (g: SnapGuides) => void; // edit: report active alignment guides
  vars?: Record<string, unknown>;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const round1 = (n: number) => Math.round(n * 10) / 10;
const SNAP = 2.2; // snap threshold in %

// Wraps a block's visual renderer with layout (flow or absolute), drag-to-move
// with alignment snapping, per-block typography, reveal, selection and clicks.
export function BlockView({ block, mode, selected, onSelect, visibleStep = Infinity, hiddenOverride, onClick, onGuides, vars }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const def = getBlockDef(block.type);
  const updateBlock = useStore((s) => s.updateBlock);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const L = block.layout;
  const isAbsolute = L.position === 'absolute';
  const scrollAnim = mode === 'present' && block.anim.on === 'scroll';
  const inView = useInView(ref, scrollAnim);

  const stepActive = mode === 'edit' || (block.anim.step ?? 0) <= visibleStep;
  const revealed = mode === 'edit' ? true : stepActive && (!scrollAnim || inView);
  const hidden = hiddenOverride ?? block.hidden;
  const clickable = mode === 'present' && block.interactions.some((i) => i.on === 'click');
  const draggable = mode === 'edit' && isAbsolute && !drag.current;

  // ----- drag to move (edit + absolute), with alignment snapping -----
  const onPointerDown = (e: React.PointerEvent) => {
    if (mode !== 'edit') { if (clickable) onClick?.(); return; }
    e.stopPropagation();
    onSelect?.();
    if (!isAbsolute || e.button !== 0) return;
    if ((e.target as HTMLElement).closest('input,button,textarea,select,a,canvas,iframe')) return;
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
    `reveal-${block.anim.reveal ?? 'none'}`,
    revealed ? 'is-revealed' : 'is-hidden-step',
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
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <def.Render block={block} mode={mode} vars={vars} />
    </div>
  );
}
