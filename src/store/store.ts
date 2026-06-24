import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Deck, Section, Block, BlockType, AppMode } from '../model/types';
import { readEmbeddedDeck } from '../model/serialize';
import { newSection, newBlock } from '../model/defaults';

const clone = <T,>(v: T): T => structuredClone(v);

interface History {
  past: Deck[];
  future: Deck[];
}

interface EditorState {
  deck: Deck;
  mode: AppMode;
  currentSection: number;
  selectedBlockId: string | null;
  history: History;

  // mode / nav
  setMode: (m: AppMode) => void;
  goToSection: (i: number) => void;
  nextSection: () => void;
  prevSection: () => void;

  // selection
  selectBlock: (id: string | null) => void;

  // sections
  addSection: () => void;
  deleteSection: (i: number) => void;
  duplicateSection: (i: number) => void;
  reorderSections: (from: number, to: number) => void;
  updateSection: (i: number, patch: Partial<Section>) => void;

  // blocks (operate on current section)
  addBlock: (type: BlockType) => void;
  updateBlock: (id: string, patch: Partial<Block>, transient?: boolean) => void;
  updateBlockProps: (id: string, patch: Record<string, unknown>) => void;
  deleteBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  moveBlock: (id: string, dir: -1 | 1) => void;

  setScripts: (scripts: string[]) => void;
  setTitle: (title: string) => void;
  setTheme: (patch: Partial<Deck['theme']>) => void;
  replaceDeck: (deck: Deck) => void;

  undo: () => void;
  redo: () => void;
}

const HISTORY_LIMIT = 60;

export const useStore = create<EditorState>((set, get) => {
  // `transient` updates (e.g. live drag) skip history; commit a final
  // non-transient update at the end of the gesture to record one entry.
  function commit(mutator: (d: Deck) => void, transient = false) {
    const s = get();
    const next = clone(s.deck);
    mutator(next);
    if (transient) { set({ deck: next }); return; }
    set({ deck: next, history: { past: [...s.history.past, s.deck].slice(-HISTORY_LIMIT), future: [] } });
  }
  const sec = (d: Deck) => d.sections[get().currentSection];

  return {
    deck: readEmbeddedDeck(),
    mode: 'edit',
    currentSection: 0,
    selectedBlockId: null,
    history: { past: [], future: [] },

    setMode: (mode) => set({ mode, selectedBlockId: null }),
    goToSection: (i) => {
      const n = get().deck.sections.length;
      set({ currentSection: Math.max(0, Math.min(n - 1, i)), selectedBlockId: null });
    },
    nextSection: () => get().goToSection(get().currentSection + 1),
    prevSection: () => get().goToSection(get().currentSection - 1),

    selectBlock: (id) => set({ selectedBlockId: id }),

    addSection: () => {
      commit((d) => d.sections.splice(get().currentSection + 1, 0, newSection()));
      set({ currentSection: get().currentSection + 1, selectedBlockId: null });
    },
    deleteSection: (i) => {
      if (get().deck.sections.length <= 1) return;
      commit((d) => d.sections.splice(i, 1));
      set({ currentSection: Math.max(0, Math.min(get().currentSection, get().deck.sections.length - 1)) });
    },
    duplicateSection: (i) => {
      commit((d) => {
        const copy = clone(d.sections[i]);
        copy.id = nanoid(8);
        copy.blocks.forEach((b) => (b.id = nanoid(8)));
        d.sections.splice(i + 1, 0, copy);
      });
      set({ currentSection: i + 1, selectedBlockId: null });
    },
    reorderSections: (from, to) => {
      commit((d) => {
        const [m] = d.sections.splice(from, 1);
        d.sections.splice(to, 0, m);
      });
      set({ currentSection: to });
    },
    updateSection: (i, patch) => commit((d) => { d.sections[i] = { ...d.sections[i], ...patch }; }),

    addBlock: (type) => {
      const block = newBlock(type);
      commit((d) => sec(d).blocks.push(block));
      set({ selectedBlockId: block.id });
    },
    updateBlock: (id, patch, transient = false) =>
      commit((d) => {
        const s = sec(d);
        s.blocks = s.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b));
      }, transient),
    updateBlockProps: (id, patch) =>
      commit((d) => {
        const s = sec(d);
        s.blocks = s.blocks.map((b) => (b.id === id ? { ...b, props: { ...b.props, ...patch } } : b));
      }),
    deleteBlock: (id) => {
      commit((d) => {
        const s = sec(d);
        s.blocks = s.blocks.filter((b) => b.id !== id);
      });
      if (get().selectedBlockId === id) set({ selectedBlockId: null });
    },
    duplicateBlock: (id) => {
      let newId = '';
      commit((d) => {
        const s = sec(d);
        const idx = s.blocks.findIndex((b) => b.id === id);
        if (idx < 0) return;
        const copy = clone(s.blocks[idx]);
        copy.id = newId = nanoid(8);
        s.blocks.splice(idx + 1, 0, copy);
      });
      if (newId) set({ selectedBlockId: newId });
    },
    moveBlock: (id, dir) =>
      commit((d) => {
        const s = sec(d);
        const i = s.blocks.findIndex((b) => b.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= s.blocks.length) return;
        [s.blocks[i], s.blocks[j]] = [s.blocks[j], s.blocks[i]];
      }),

    setScripts: (scripts) => commit((d) => { d.scripts = scripts; }),
    setTitle: (title) => commit((d) => { d.title = title; }),
    setTheme: (patch) => commit((d) => { d.theme = { ...d.theme, ...patch }; }),
    replaceDeck: (deck) => set({ deck, currentSection: 0, selectedBlockId: null, history: { past: [], future: [] } }),

    undo: () => {
      const { history, deck } = get();
      if (!history.past.length) return;
      const prev = history.past[history.past.length - 1];
      set({
        deck: prev,
        history: { past: history.past.slice(0, -1), future: [deck, ...history.future] },
        selectedBlockId: null,
        currentSection: Math.min(get().currentSection, prev.sections.length - 1),
      });
    },
    redo: () => {
      const { history, deck } = get();
      if (!history.future.length) return;
      const next = history.future[0];
      set({
        deck: next,
        history: { past: [...history.past, deck], future: history.future.slice(1) },
        selectedBlockId: null,
        currentSection: Math.min(get().currentSection, next.sections.length - 1),
      });
    },
  };
});

export function useCurrentSection(): Section {
  return useStore((s) => s.deck.sections[s.currentSection]);
}
