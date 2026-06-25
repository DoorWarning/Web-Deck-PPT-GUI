import { useLayoutEffect, useRef, useState } from 'react';
import { useStore, useCurrentSection } from '../store/store';
import { SectionView } from '../render/SectionView';

// Center preview: the current section rendered at the fixed canvas resolution
// (canvas.w × canvas.h) and uniformly scaled to fit the frame — WYSIWYG with the
// reveal.js presentation. Clicking a block selects it; empty space deselects.
// Drag/resize math reads getBoundingClientRect, which already accounts for the
// transform scale, so editing stays accurate at any size.
export function Stage() {
  const section = useCurrentSection();
  const theme = useStore((s) => s.deck.theme);
  const canvas = useStore((s) => s.deck.canvas);
  const selectedBlockId = useStore((s) => s.selectedBlockId);
  const selectBlock = useStore((s) => s.selectBlock);

  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / canvas.w);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [canvas.w]);

  return (
    <div className="stage">
      <div className="stage-frame" ref={frameRef} style={{ aspectRatio: `${canvas.w} / ${canvas.h}` }}>
        <div
          className="stage-scale"
          style={{ width: canvas.w, height: canvas.h, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          <SectionView
            section={section}
            theme={theme}
            mode="edit"
            selectedBlockId={selectedBlockId}
            onSelectBlock={selectBlock}
          />
        </div>
      </div>
      <p className="stage-hint">미리보기는 캔버스 비율({canvas.w}×{canvas.h})로 표시됩니다.</p>
    </div>
  );
}
