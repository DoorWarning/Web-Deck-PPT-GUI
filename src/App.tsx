import { useEffect, useRef, useState } from 'react';
import { useStore } from './store/store';
import { Toolbar } from './editor/Toolbar';
import { SectionPanel } from './editor/SectionPanel';
import { BlockPalette } from './editor/BlockPalette';
import { Stage } from './editor/Stage';
import { BlockInspector } from './editor/BlockInspector';
import { MobileApp } from './editor/MobileApp';
import { Presenter } from './present/Presenter';
import { useIsMobile } from './hooks/useIsMobile';

export default function App() {
  const mode = useStore((s) => s.mode);
  const isMobile = useIsMobile();
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [leftW, setLeftW] = useState(240);
  const [rightW, setRightW] = useState(320);
  useEditorShortcuts(mode === 'edit');

  // Deep-link: a deployed/shared link can auto-start the presentation with
  // ?present or #present (e.g. GitHub Pages link for the audience).
  useEffect(() => {
    const wantPresent = /present/i.test(location.hash) || new URLSearchParams(location.search).has('present');
    if (wantPresent) useStore.getState().setMode('present');
  }, []);

  if (mode === 'present') return <Presenter />;
  if (isMobile) return <MobileApp />;

  return (
    <div className="app">
      <Toolbar />
      <BlockPalette />
      <div
        className="app-body"
        style={{ gridTemplateColumns: `${leftOpen ? leftW + 'px' : '34px'} 1fr ${rightOpen ? rightW + 'px' : '34px'}` }}
      >
        <aside className={'left-rail' + (leftOpen ? '' : ' collapsed')}>
          <button
            className="rail-toggle"
            title={leftOpen ? '섹션 패널 접기' : '섹션 패널 열기'}
            onClick={() => setLeftOpen((o) => !o)}
          >
            {leftOpen ? '‹ 섹션' : '섹션'}
          </button>
          {leftOpen && <SectionPanel />}
          {leftOpen && <RailResizer edge="e" onResize={(dx) => setLeftW((w) => clamp(w + dx, 180, 520))} />}
        </aside>
        <Stage />
        <aside className={'right-rail' + (rightOpen ? '' : ' collapsed')}>
          <button
            className="rail-toggle"
            title={rightOpen ? '속성 패널 접기' : '속성 패널 열기'}
            onClick={() => setRightOpen((o) => !o)}
          >
            {rightOpen ? '속성 ›' : '속성'}
          </button>
          {rightOpen && <BlockInspector />}
          {rightOpen && <RailResizer edge="w" onResize={(dx) => setRightW((w) => clamp(w - dx, 220, 560))} />}
        </aside>
      </div>
    </div>
  );
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// Drag handle on a panel edge to resize it. Reports the pointer delta (px) since
// the last move; the parent clamps it into the panel width. 'e' sits on the
// right edge (left rail), 'w' on the left edge (right rail).
function RailResizer({ edge, onResize }: { edge: 'e' | 'w'; onResize: (dx: number) => void }) {
  const last = useRef(0);
  return (
    <div
      className={`rail-resizer ${edge}`}
      onPointerDown={(e) => { last.current = e.clientX; (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
      onPointerMove={(e) => {
        if (e.buttons !== 1) return;
        const dx = e.clientX - last.current;
        last.current = e.clientX;
        if (dx) onResize(dx);
      }}
    />
  );
}

// Global edit-mode shortcuts. Disabled while typing in inputs/code editors.
function useEditorShortcuts(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName);
      const s = useStore.getState();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? s.redo() : s.undo(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); s.redo(); return; }
      if (typing) return;
      // Outside of inputs, Backspace must not navigate the browser back
      // (some browsers still do this) — it would unload the editor and reset.
      if (e.key === 'Backspace') { e.preventDefault(); return; }
      // Block-first: when a block is selected the shortcut targets the block,
      // otherwise it targets the current slide section.
      if (e.key === 'Delete') {
        e.preventDefault();
        if (s.selectedBlockId) s.deleteBlock(s.selectedBlockId);
        else s.deleteSection(s.currentSection);
        return;
      }
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        if (s.selectedBlockId) s.duplicateBlock(s.selectedBlockId);
        else s.duplicateSection(s.currentSection);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);
}
