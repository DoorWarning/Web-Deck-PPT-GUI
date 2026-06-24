import { useState } from 'react';
import type { BlockDef, BlockRenderProps, BlockEditProps } from './types';

interface PollProps {
  question: string;
  options: string[];
  correct: number; // -1 => poll, >=0 => quiz with this correct index
  persist: boolean;
}

function Render({ block }: BlockRenderProps) {
  const p = block.props as unknown as PollProps;
  const isQuiz = p.correct >= 0;
  const storeKey = `poll:${block.id}`;

  const [counts, setCounts] = useState<number[]>(() => {
    if (p.persist) {
      try { const s = JSON.parse(localStorage.getItem(storeKey) || ''); if (Array.isArray(s)) return s; } catch { /* */ }
    }
    return p.options.map(() => 0);
  });
  const [picked, setPicked] = useState<number | null>(null);

  const total = counts.reduce((a, b) => a + b, 0);
  const vote = (i: number) => {
    setPicked(i);
    if (!isQuiz) {
      const next = counts.map((c, idx) => (idx === i ? c + 1 : c));
      setCounts(next);
      if (p.persist) localStorage.setItem(storeKey, JSON.stringify(next));
    }
  };

  return (
    <div className="poll-block">
      <h3 className="poll-q">{p.question}</h3>
      <div className="poll-options">
        {p.options.map((opt, i) => {
          const pct = total ? Math.round((counts[i] / total) * 100) : 0;
          const state = isQuiz && picked !== null ? (i === p.correct ? 'correct' : i === picked ? 'wrong' : '') : '';
          return (
            <button key={i} className={`poll-opt ${state}`} onClick={() => vote(i)} disabled={isQuiz && picked !== null}>
              {!isQuiz && <span className="poll-bar" style={{ width: `${pct}%` }} />}
              <span className="poll-opt-label">{opt}</span>
              {!isQuiz && picked !== null && <span className="poll-pct">{pct}%</span>}
              {isQuiz && picked !== null && i === p.correct && <span className="poll-mark">✓</span>}
              {isQuiz && picked === i && i !== p.correct && <span className="poll-mark">✗</span>}
            </button>
          );
        })}
      </div>
      {isQuiz && picked !== null && (
        <p className="poll-feedback">{picked === p.correct ? '정답입니다! 🎉' : '아쉬워요. 다시 생각해 보세요.'}</p>
      )}
      {!isQuiz && total > 0 && <p className="poll-total">총 {total}표</p>}
    </div>
  );
}

function Edit({ block, update }: BlockEditProps) {
  const p = block.props as unknown as PollProps;
  const setOpt = (i: number, v: string) => update({ options: p.options.map((o, idx) => (idx === i ? v : o)) });
  return (
    <>
      <label className="field col"><span>질문</span>
        <input value={p.question} onChange={(e) => update({ question: e.target.value })} />
      </label>
      <div className="field col"><span>옵션</span>
        {p.options.map((o, i) => (
          <div key={i} className="opt-row">
            <input value={o} onChange={(e) => setOpt(i, e.target.value)} />
            <button className="icon-del" onClick={() => update({ options: p.options.filter((_, idx) => idx !== i), correct: p.correct === i ? -1 : p.correct })}>✕</button>
          </div>
        ))}
        <button className="full" onClick={() => update({ options: [...p.options, `옵션 ${p.options.length + 1}`] })}>+ 옵션</button>
      </div>
      <label className="field"><span>모드</span>
        <select value={p.correct >= 0 ? 'quiz' : 'poll'} onChange={(e) => update({ correct: e.target.value === 'quiz' ? 0 : -1 })}>
          <option value="poll">폴 (집계)</option>
          <option value="quiz">퀴즈 (정답)</option>
        </select>
      </label>
      {p.correct >= 0 && (
        <label className="field"><span>정답</span>
          <select value={p.correct} onChange={(e) => update({ correct: Number(e.target.value) })}>
            {p.options.map((o, i) => <option key={i} value={i}>{o}</option>)}
          </select>
        </label>
      )}
      <label className="field"><span>localStorage 누적</span>
        <input type="checkbox" checked={p.persist} onChange={(e) => update({ persist: e.target.checked })} />
      </label>
    </>
  );
}

export const pollBlock: BlockDef = { type: 'poll', label: '폴/퀴즈', icon: '🗳️', Render, Edit };
