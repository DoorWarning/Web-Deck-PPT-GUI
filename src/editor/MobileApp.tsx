import { useEffect, useState } from 'react';
import { useStore } from '../store/store';
import { MobileTopBar } from './MobileTopBar';
import { SectionPanel } from './SectionPanel';
import { BlockPalette } from './BlockPalette';
import { Stage } from './Stage';
import { BlockInspector } from './BlockInspector';

type Tab = 'slides' | 'blocks' | 'props';

// Mobile editor shell: compact toolbar, an always-visible canvas preview, and
// a bottom tab bar that swaps the active panel (sections / palette / inspector).
export function MobileApp() {
  const [tab, setTab] = useState<Tab>('slides');
  const selectedId = useStore((s) => s.selectedBlockId);

  // Tapping a block on the canvas jumps to its properties.
  useEffect(() => {
    if (selectedId) setTab('props');
  }, [selectedId]);

  return (
    <div className="app mobile">
      <MobileTopBar />
      <div className="m-stage">
        <Stage />
      </div>
      <div className="m-panel">
        {tab === 'slides' && <SectionPanel />}
        {tab === 'blocks' && <BlockPalette />}
        {tab === 'props' && <BlockInspector />}
      </div>
      <nav className="m-tabbar">
        <button className={tab === 'slides' ? 'on' : ''} onClick={() => setTab('slides')}>🗂 슬라이드</button>
        <button className={tab === 'blocks' ? 'on' : ''} onClick={() => setTab('blocks')}>➕ 블록</button>
        <button className={tab === 'props' ? 'on' : ''} onClick={() => setTab('props')}>⚙ 속성</button>
      </nav>
    </div>
  );
}
