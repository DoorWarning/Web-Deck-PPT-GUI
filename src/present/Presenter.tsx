import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useStore } from '../store/store';
import { SectionView } from '../render/SectionView';
import { runInteraction, type InteractionContext } from '../runtime/interactions';
import { createDeckApi, runUserScript, type DeckApi } from '../runtime/api';

// Fullscreen interactive presentation runtime. Sections navigate left/right;
// fragment steps reveal within a section before advancing to the next.
export function Presenter() {
  const deck = useStore((s) => s.deck);
  const current = useStore((s) => s.currentSection);
  const goToSection = useStore((s) => s.goToSection);
  const setMode = useStore((s) => s.setMode);

  const section = deck.sections[current];
  const maxStep = useMemo(
    () => section.blocks.reduce((m, b) => Math.max(m, b.anim.step ?? 0), 0),
    [section]
  );

  const [step, setStep] = useState(0);
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const vars = useRef<Record<string, unknown>>({});
  const handlers = useRef<{ sectionchange: ((n: number) => void)[] }>({ sectionchange: [] });
  const apiRef = useRef<DeckApi | null>(null);

  const blockHidden = (id: string) =>
    deck.sections[useStore.getState().currentSection].blocks.find((b) => b.id === id)?.hidden ?? false;

  const advance = useCallback(() => {
    if (step < maxStep) setStep((s) => s + 1);
    else goToSection(useStore.getState().currentSection + 1);
  }, [step, maxStep, goToSection]);

  const retreat = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
    else goToSection(useStore.getState().currentSection - 1);
  }, [step, goToSection]);

  const ctx: InteractionContext = {
    goto: (n) => goToSection(n - 1),
    next: advance,
    prev: retreat,
    toggleBlock: (id) => setHidden((h) => ({ ...h, [id]: !(h[id] ?? blockHidden(id)) })),
    setVar: (n, v) => { vars.current[n] = v; },
    runScript: (code) => apiRef.current && runUserScript(code, apiRef.current),
  };
  // Keep a live ref to the fresh ctx so the persisted Deck API never calls a
  // stale advance/retreat (which would capture an old fragment step).
  const ctxRef = useRef<InteractionContext>(ctx);
  ctxRef.current = ctx;

  if (!apiRef.current) {
    const stable: InteractionContext = {
      goto: (n) => ctxRef.current.goto(n),
      next: () => ctxRef.current.next(),
      prev: () => ctxRef.current.prev(),
      toggleBlock: (id) => ctxRef.current.toggleBlock(id),
      setVar: (n, v) => ctxRef.current.setVar(n, v),
      runScript: (c) => ctxRef.current.runScript(c),
    };
    apiRef.current = createDeckApi(stable, () => useStore.getState().currentSection + 1, vars.current, handlers.current);
  }

  // Run global custom scripts once.
  useEffect(() => {
    handlers.current.sectionchange = [];
    deck.scripts.forEach((code) => apiRef.current && runUserScript(code, apiRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On section change: reset fragment step, fire sectionchange handlers.
  useEffect(() => {
    setStep(0);
    handlers.current.sectionchange.forEach((fn) => { try { fn(current + 1); } catch (e) { console.error(e); } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  // Fire 'step' interactions for blocks at the newly active step.
  useEffect(() => {
    for (const b of section.blocks) {
      if ((b.anim.step ?? 0) !== step) continue;
      for (const it of b.interactions) if (it.on === 'step') runInteraction(it, ctx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, step]);

  // Keyboard navigation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(t.tagName)) return; // don't hijack playground typing
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); advance(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); retreat(); }
      else if (e.key === 'Escape') exit();
      else if (e.key.toLowerCase() === 'f') toggleFullscreen();
      else if (e.key === 'Home') goToSection(0);
      else if (e.key === 'End') goToSection(deck.sections.length - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advance, retreat]);

  const exit = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setMode('edit');
  }, [setMode]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  };

  const onBlockClick = (id: string) => {
    const b = section.blocks.find((x) => x.id === id);
    if (!b) return;
    for (const it of b.interactions) if (it.on === 'click') runInteraction(it, ctx);
  };

  const progress = ((current + 1) / deck.sections.length) * 100;

  return (
    <div className="presenter">
      <div key={current} className={`present-stage transition-${section.transition}`}>
        <SectionView
          section={section}
          theme={deck.theme}
          mode="present"
          visibleStep={step}
          hiddenOverrides={hidden}
          onBlockClick={onBlockClick}
          vars={vars.current}
        />
      </div>

      <div className="present-progress"><span style={{ width: `${progress}%` }} /></div>

      <div className="present-controls">
        <button onClick={retreat} title="이전">‹</button>
        <span>{current + 1} / {deck.sections.length}{maxStep > 0 ? ` · ${step}/${maxStep}` : ''}</span>
        <button onClick={advance} title="다음">›</button>
        <button onClick={toggleFullscreen} title="전체화면 (F)">⛶</button>
        <button onClick={exit} title="나가기 (Esc)">✕</button>
      </div>
    </div>
  );
}
