import { useStore, useCurrentSection } from '../store/store';
import { SectionView } from '../render/SectionView';

// Center preview: the current section rendered live and responsive inside a
// 16:9 frame. Clicking a block selects it; clicking empty space deselects.
export function Stage() {
  const section = useCurrentSection();
  const theme = useStore((s) => s.deck.theme);
  const canvas = useStore((s) => s.deck.canvas);
  const selectedBlockId = useStore((s) => s.selectedBlockId);
  const selectBlock = useStore((s) => s.selectBlock);

  return (
    <div className="stage">
      <div className="stage-frame" style={{ aspectRatio: `${canvas.w} / ${canvas.h}` }}>
        <SectionView
          section={section}
          theme={theme}
          mode="edit"
          selectedBlockId={selectedBlockId}
          onSelectBlock={selectBlock}
        />
      </div>
      <p className="stage-hint">미리보기는 캔버스 비율({canvas.w}×{canvas.h})로 표시됩니다.</p>
    </div>
  );
}
