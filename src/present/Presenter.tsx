import { useEffect, useRef, useState } from 'react';
import Reveal from 'reveal.js';
import 'reveal.js/dist/reveal.css';
import { useStore } from '../store/store';
import { SectionView } from '../render/SectionView';
import { runInteraction, type InteractionContext } from '../runtime/interactions';
import { createDeckApi, runUserScript, type DeckApi } from '../runtime/api';

type RevealInstance = InstanceType<typeof Reveal>;

// Presentation runtime powered by reveal.js. Each Deck section becomes a reveal
// <section> slide; our React SectionView renders the interactive blocks inside.
// Fragment steps, transitions, fullscreen, overview and progress are reveal's;
// block interactions / custom scripts route through reveal's navigation API.
export function Presenter() {
  const deck = useStore((s) => s.deck);
  const setMode = useStore((s) => s.setMode);
  const startSection = useRef(useStore.getState().currentSection);

  const revealRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<RevealInstance | null>(null);
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const vars = useRef<Record<string, unknown>>({});
  const handlers = useRef<{ sectionchange: ((n: number) => void)[] }>({ sectionchange: [] });
  const apiRef = useRef<DeckApi | null>(null);

  const blockHidden = (id: string): boolean => {
    for (const s of deck.sections) { const b = s.blocks.find((x) => x.id === id); if (b) return b.hidden ?? false; }
    return false;
  };
  const currentBlocks = () => deck.sections[deckRef.current?.getIndices().h ?? 0]?.blocks ?? [];

  const ctx: InteractionContext = {
    goto: (n) => deckRef.current?.slide(n - 1, 0, 0),
    next: () => deckRef.current?.next(),
    prev: () => deckRef.current?.prev(),
    toggleBlock: (id) => setHidden((h) => ({ ...h, [id]: !(h[id] ?? blockHidden(id)) })),
    setVar: (n, v) => { vars.current[n] = v; },
    runScript: (code) => apiRef.current && runUserScript(code, apiRef.current),
  };
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
    apiRef.current = createDeckApi(stable, () => (deckRef.current?.getIndices().h ?? 0) + 1, vars.current, handlers.current);
  }

  useEffect(() => {
    if (!revealRef.current) return;
    const r = new Reveal(revealRef.current, {
      embedded: false,
      controls: true,
      progress: true,
      hash: false,
      center: false,
      slideNumber: 'c/t',
      transition: 'fade',
      width: deck.canvas.w,
      height: deck.canvas.h,
      margin: 0.04,
      minScale: 0.2,
      maxScale: 2.0,
      keyboard: true,
    });
    deckRef.current = r;

    r.initialize().then(() => {
      r.slide(startSection.current, 0, 0);
      deck.scripts.forEach((code) => apiRef.current && runUserScript(code, apiRef.current));
    });

    // Section enter → fire sectionchange handlers.
    r.on('slidechanged', ((ev: { indexh?: number }) => {
      handlers.current.sectionchange.forEach((fn) => { try { fn((ev.indexh ?? 0) + 1); } catch (e) { console.error(e); } });
    }) as EventListener);

    // Fragment shown → run that block's 'step' interactions.
    r.on('fragmentshown', ((ev: { fragment?: HTMLElement }) => {
      const id = ev.fragment?.getAttribute('data-block-id');
      if (!id) return;
      const b = currentBlocks().find((x) => x.id === id);
      if (b) for (const it of b.interactions) if (it.on === 'step') runInteraction(it, ctxRef.current);
    }) as EventListener);

    return () => { r.destroy(); deckRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exit = () => {
    const h = deckRef.current?.getIndices().h ?? 0;
    useStore.getState().goToSection(h);
    setMode('edit');
  };

  // Q exits to the editor (Esc/O is reveal's overview).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(t.tagName)) return;
      if (e.key === 'q' || e.key === 'Q') exit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onBlockClick = (id: string) => {
    const b = currentBlocks().find((x) => x.id === id);
    if (!b) return;
    for (const it of b.interactions) if (it.on === 'click') runInteraction(it, ctxRef.current);
  };

  return (
    <div className="presenter-reveal">
      <div className="reveal" ref={revealRef}>
        <div className="slides">
          {deck.sections.map((section) => (
            <section key={section.id} data-transition={section.transition} data-background-color="#000">
              <SectionView
                section={section}
                theme={deck.theme}
                mode="present"
                hiddenOverrides={hidden}
                onBlockClick={onBlockClick}
                vars={vars.current}
              />
            </section>
          ))}
        </div>
      </div>
      <button className="present-exit" onClick={exit} title="편집으로 (Q)">✕ 편집</button>
    </div>
  );
}
