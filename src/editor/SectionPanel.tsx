import { useRef } from 'react';
import { useStore } from '../store/store';
import { SectionView } from '../render/SectionView';

// Left rail: section thumbnails with add/delete/duplicate and drag-reorder.
export function SectionPanel() {
  const deck = useStore((s) => s.deck);
  const current = useStore((s) => s.currentSection);
  const goToSection = useStore((s) => s.goToSection);
  const addSection = useStore((s) => s.addSection);
  const deleteSection = useStore((s) => s.deleteSection);
  const duplicateSection = useStore((s) => s.duplicateSection);
  const reorderSections = useStore((s) => s.reorderSections);
  const dragFrom = useRef<number | null>(null);

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
            <div className="section-thumb">
              <div className="thumb-scale">
                <SectionView section={sec} theme={deck.theme} mode="present" visibleStep={Infinity} />
              </div>
            </div>
            <div className="section-thumb-actions">
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
