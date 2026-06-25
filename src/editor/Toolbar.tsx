import { useState } from 'react';
import { useStore } from '../store/store';
import { exportStandalone } from '../io/exportSingleFile';
import { exportJson } from '../io/json';
import { HelpModal } from './HelpModal';
import { ImportModal } from './ImportModal';

// Top toolbar: title, history, file ops, present.
export function Toolbar() {
  const [showHelp, setShowHelp] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const title = useStore((s) => s.deck.title);
  const setTitle = useStore((s) => s.setTitle);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => s.history.past.length > 0);
  const canRedo = useStore((s) => s.history.future.length > 0);
  const setMode = useStore((s) => s.setMode);

  return (
    <div className="toolbar">
      <strong className="brand">◆ WebDeck</strong>
      <input className="deck-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <span className="sep" />
      <button onClick={undo} disabled={!canUndo} title="실행취소 (Ctrl+Z)">↶</button>
      <button onClick={redo} disabled={!canRedo} title="다시실행 (Ctrl+Shift+Z)">↷</button>
      <span className="spacer" />
      <button className="help-btn" onClick={() => setShowHelp(true)} title="사용법 / AI 프롬프트">?</button>
      <button onClick={() => setShowImport(true)}>불러오기</button>
      <button onClick={() => exportJson(useStore.getState().deck)}>JSON 저장</button>
      <button className="primary" onClick={() => exportStandalone(useStore.getState().deck)} title="편집 가능한 단일 HTML">💾 HTML</button>
      <button className="primary" onClick={() => setMode('present')}>▶ 발표</button>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
    </div>
  );
}
