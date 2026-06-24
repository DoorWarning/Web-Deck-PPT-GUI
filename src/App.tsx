import { useEffect } from 'react';
import { useStore } from './store/store';
import { Toolbar } from './editor/Toolbar';
import { SectionPanel } from './editor/SectionPanel';
import { BlockPalette } from './editor/BlockPalette';
import { Stage } from './editor/Stage';
import { BlockInspector } from './editor/BlockInspector';
import { Presenter } from './present/Presenter';

export default function App() {
  const mode = useStore((s) => s.mode);
  useEditorShortcuts(mode === 'edit');

  // Deep-link: a deployed/shared link can auto-start the presentation with
  // ?present or #present (e.g. GitHub Pages link for the audience).
  useEffect(() => {
    const wantPresent = /present/i.test(location.hash) || new URLSearchParams(location.search).has('present');
    if (wantPresent) useStore.getState().setMode('present');
  }, []);

  if (mode === 'present') return <Presenter />;

  return (
    <div className="app">
      <Toolbar />
      <div className="app-body">
        <aside className="left-rail">
          <SectionPanel />
          <BlockPalette />
        </aside>
        <Stage />
        <BlockInspector />
      </div>
    </div>
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
      if ((e.key === 'Delete' || e.key === 'Backspace') && s.selectedBlockId) { e.preventDefault(); s.deleteBlock(s.selectedBlockId); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);
}
