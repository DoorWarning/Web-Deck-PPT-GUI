import { useEffect, useState } from 'react';
import { useStore } from '../store/store';
import { parseDeckJson, readTextFile } from '../io/json';

// "불러오기" dialog: paste deck JSON directly, or load it from a file into the
// editor below, then apply. Reuses the shared .modal styles.
export function ImportModal({ onClose }: { onClose: () => void }) {
  const replaceDeck = useStore((s) => s.replaceDeck);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const pickFile = async () => {
    try {
      const t = await readTextFile();
      setText(t);
      setError('');
    } catch { /* picker cancelled */ }
  };

  const apply = () => {
    try {
      replaceDeck(parseDeckJson(text));
      onClose();
    } catch (e) {
      setError('불러오기 실패: ' + (e as Error).message);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>불러오기 — 덱 JSON</h2>
          <button className="modal-x" onClick={onClose} title="닫기 (Esc)">✕</button>
        </div>

        <div className="modal-body">
          <p className="modal-note">덱 JSON을 아래에 <b>붙여넣거나</b> 파일에서 불러온 뒤 <b>적용</b>하세요. AI가 만든 Deck JSON도 여기에 붙여넣어 적용할 수 있어요.</p>
          <textarea
            className="import-textarea mono"
            value={text}
            onChange={(e) => { setText(e.target.value); setError(''); }}
            placeholder={'{\n  "version": 2,\n  "sections": [ ... ]\n}'}
            spellCheck={false}
            autoFocus
          />
          {error && <p className="import-error">{error}</p>}
          <div className="modal-downloads">
            <button onClick={pickFile}>📂 파일에서 불러오기</button>
          </div>
        </div>

        <div className="modal-foot">
          <button onClick={onClose}>취소</button>
          <button className="primary" onClick={apply} disabled={!text.trim()}>적용</button>
        </div>
      </div>
    </div>
  );
}
