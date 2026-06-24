import { useState } from 'react';
import type { Section, DeckTheme } from '../model/types';
import { BlockView, type SnapGuides } from './BlockView';

interface Props {
  section: Section;
  theme: DeckTheme;
  mode: 'edit' | 'present';
  // edit
  selectedBlockId?: string | null;
  onSelectBlock?: (id: string | null) => void;
  // present
  visibleStep?: number;
  hiddenOverrides?: Record<string, boolean>;
  onBlockClick?: (id: string) => void;
  vars?: Record<string, unknown>;
}

// Renders one section as a responsive web-page region. Layout = flow (stacked),
// center (vertically centered), split/grid (2-col), fixed (scaled — handled by
// caller). Shared by editor preview and presenter.
export function SectionView({
  section, theme, mode,
  selectedBlockId, onSelectBlock,
  visibleStep, hiddenOverrides, onBlockClick, vars,
}: Props) {
  const flow = section.blocks.filter((b) => b.layout.position !== 'absolute');
  const absolute = section.blocks.filter((b) => b.layout.position === 'absolute');
  const [guides, setGuides] = useState<SnapGuides>({});
  const onGuides = mode === 'edit' ? setGuides : undefined;
  return (
    <div
      className={`section layout-${section.layout}`}
      style={{
        background: section.background,
        color: section.color,
        ['--accent' as string]: theme.accent,
        ['--max-w' as string]: `${theme.maxWidth}px`,
        ['--pad' as string]: `${section.padding ?? 64}px`,
        fontFamily: theme.fontFamily,
      }}
      onPointerDown={mode === 'edit' ? () => onSelectBlock?.(null) : undefined}
    >
      <div className="section-inner">
        {flow.map((b) => (
          <BlockView
            key={b.id}
            block={b}
            mode={mode}
            selected={selectedBlockId === b.id}
            onSelect={() => onSelectBlock?.(b.id)}
            visibleStep={visibleStep}
            hiddenOverride={hiddenOverrides?.[b.id]}
            onClick={() => onBlockClick?.(b.id)}
            vars={vars}
          />
        ))}
        {mode === 'edit' && section.blocks.length === 0 && (
          <div className="empty-section">블록을 추가하세요 (왼쪽 팔레트)</div>
        )}
      </div>

      {/* Absolutely-positioned blocks are placed relative to the whole section. */}
      {absolute.map((b) => (
        <BlockView
          key={b.id}
          block={b}
          mode={mode}
          selected={selectedBlockId === b.id}
          onSelect={() => onSelectBlock?.(b.id)}
          visibleStep={visibleStep}
          hiddenOverride={hiddenOverrides?.[b.id]}
          onClick={() => onBlockClick?.(b.id)}
          onGuides={onGuides}
          vars={vars}
        />
      ))}

      {/* Alignment guide lines while dragging (edit mode). */}
      {mode === 'edit' && guides.x != null && <div className="snap-guide v" style={{ left: `${guides.x}%` }} />}
      {mode === 'edit' && guides.y != null && <div className="snap-guide h" style={{ top: `${guides.y}%` }} />}
    </div>
  );
}
