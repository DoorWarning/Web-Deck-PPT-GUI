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
      <BlockPalette />
      <div className="app-body">
        <aside className="left-rail">
          <SectionPanel />
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
      // Block-first: when a block is selected the shortcut targets the block,
      // otherwise it targets the current slide section.
      if (e.key === 'Delete' || e.key === 'Backspace') {
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
