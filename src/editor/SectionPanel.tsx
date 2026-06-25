import { useLayoutEffect, useRef, useState } from 'react';
import { useStore } from '../store/store';
import { SectionView } from '../render/SectionView';
import type { Section, DeckTheme } from '../model/types';

// One section preview: the fixed canvas-sized section scaled down to fit its
// container width (so it fills the row responsively on any layout).
function SectionThumb({ section, theme, canvas }: { section: Section; theme: DeckTheme; canvas: { w: number; h: number } }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / canvas.w);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [canvas.w]);
  return (
    <div className="section-thumb" ref={ref} style={{ aspectRatio: `${canvas.w} / ${canvas.h}` }}>
      <div className="thumb-scale" style={{ width: canvas.w, height: canvas.h, transform: `scale(${scale})` }}>
        <SectionView section={section} theme={theme} mode="present" />
      </div>
    </div>
  );
}

// Left rail: section thumbnails with add/delete/duplicate, reorder (drag + ↑/↓).
export function SectionPanel() {
  const deck = useStore((s) => s.deck);
  const current = useStore((s) => s.currentSection);
  const goToSection = useStore((s) => s.goToSection);
  const addSection = useStore((s) => s.addSection);
  const deleteSection = useStore((s) => s.deleteSection);
  const duplicateSection = useStore((s) => s.duplicateSection);
  const reorderSections = useStore((s) => s.reorderSections);
  const dragFrom = useRef<number | null>(null);
  const last = deck.sections.length - 1;

  return (
    <div className="section-panel">
      <div className="section-list">
        {deck.sections.map((sec, i) => (
          <div
            key={sec.id}
            className={'section-thumb-row' + (i === current ? ' active' : '')}
            draggable
            onDragStart={() => (dragFrom.current = i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (dragFrom.current !== null && dragFrom.current !== i) reorderSections(dragFrom.current, i); dragFrom.current = null; }}
            onClick={() => goToSection(i)}
          >
            <span className="section-index">{i + 1}</span>
            <SectionThumb section={sec} theme={deck.theme} canvas={deck.canvas} />
            <div className="section-thumb-actions">
              <button title="위로" onClick={(e) => { e.stopPropagation(); reorderSections(i, i - 1); }} disabled={i === 0}>↑</button>
              <button title="아래로" onClick={(e) => { e.stopPropagation(); reorderSections(i, i + 1); }} disabled={i === last}>↓</button>
              <button title="복제" onClick={(e) => { e.stopPropagation(); duplicateSection(i); }}>⧉</button>
              <button title="삭제" onClick={(e) => { e.stopPropagation(); deleteSection(i); }} disabled={deck.sections.length <= 1}>🗑</button>
            </div>
          </div>
        ))}
      </div>
      <button className="add-section-btn" onClick={addSection}>+ 섹션 추가</button>
    </div>
  );
}
