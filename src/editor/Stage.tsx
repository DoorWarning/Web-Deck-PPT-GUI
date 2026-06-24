import { useStore, useCurrentSection } from '../store/store';
import { SectionView } from '../render/SectionView';

// Center preview: the current section rendered live and responsive inside a
// 16:9 frame. Clicking a block selects it; clicking empty space deselects.
export function Stage() {
  const section = useCurrentSection();
  const theme = useStore((s) => s.deck.theme);
  const selectedBlockId = useStore((s) => s.selectedBlockId);
  const selectBlock = useStore((s) => s.selectBlock);

  return (
    <div className="stage">
      <div className="stage-frame">
        <SectionView
          section={section}
          theme={theme}
          mode="edit"
          selectedBlockId={selectedBlockId}
          onSelectBlock={selectBlock}
        />
      </div>
      <p className="stage-hint">미리보기는 반응형입니다. 창 크기를 줄이면 모바일 레이아웃을 확인할 수 있어요.</p>
    </div>
  );
}
