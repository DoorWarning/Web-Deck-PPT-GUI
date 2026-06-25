import { useEffect, useState } from 'react';
import { useStore } from '../store/store';
import { exportStandalone } from '../io/exportSingleFile';
import { exportJson } from '../io/json';
import { HelpModal } from './HelpModal';
import { ImportModal } from './ImportModal';

// Compact mobile top bar: brand, title, quick Present, and a hamburger (☰) that
// drops the remaining toolbar actions down as a popup. Reuses the same store
// actions / io helpers as the desktop Toolbar.
export function MobileTopBar() {
  const [menu, setMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const title = useStore((s) => s.deck.title);
  const setTitle = useStore((s) => s.setTitle);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => s.history.past.length > 0);
  const canRedo = useStore((s) => s.history.future.length > 0);
  const setMode = useStore((s) => s.setMode);

  // Close the menu on Escape.
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu]);

  const run = (fn: () => void) => () => { setMenu(false); fn(); };

  return (
    <div className="m-topbar">
      <strong className="brand" title="WebDeck">◆</strong>
      <input className="deck-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <button className="icon-btn" onClick={undo} disabled={!canUndo} title="실행취소">↶</button>
      <button className="icon-btn" onClick={redo} disabled={!canRedo} title="다시실행">↷</button>
      <button className="primary" onClick={() => setMode('present')} title="발표">▶</button>
      <button className="m-menu-btn" onClick={() => setMenu((v) => !v)} aria-expanded={menu} title="메뉴">☰</button>

      {menu && (
        <>
          <div className="m-menu-backdrop" onClick={() => setMenu(false)} />
          <div className="m-menu" role="menu">
            <button onClick={() => { setMenu(false); setShowImport(true); }}>📂 불러오기</button>
            <button onClick={run(() => exportJson(useStore.getState().deck))}>⬇ JSON 저장</button>
            <button onClick={run(() => exportStandalone(useStore.getState().deck))}>💾 단일 HTML 저장</button>
            <button onClick={() => { setMenu(false); setShowHelp(true); }}>❔ 도움말 / AI 프롬프트</button>
          </div>
        </>
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
    </div>
  );
}
