import { useStore } from '../store/store';
import { BLOCK_LIST } from '../blocks/registry';

// Palette of block types to insert into the current section.
export function BlockPalette() {
  const addBlock = useStore((s) => s.addBlock);
  return (
    <div className="block-palette">
      <h4>블록 추가</h4>
      <div className="palette-grid">
        {BLOCK_LIST.map((def) => (
          <button key={def.type} className="palette-item" onClick={() => addBlock(def.type)}>
            <span className="palette-icon">{def.icon}</span>
            <span className="palette-label">{def.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
