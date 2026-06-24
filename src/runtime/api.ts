import type { InteractionContext } from './interactions';

// Public `Deck` API exposed to user scripts (deck.scripts + runScript actions).
export interface DeckApi {
  goto: (section1Based: number) => void;
  next: () => void;
  prev: () => void;
  toggleBlock: (blockId: string) => void;
  setVar: (name: string, value: unknown) => void;
  getVar: (name: string) => unknown;
  current: () => number; // 1-based current section
  on: (event: 'sectionchange', handler: (section1Based: number) => void) => void;
  el: (blockId: string) => HTMLElement | null;
}

type Handler = (n: number) => void;

export function createDeckApi(
  ctx: InteractionContext,
  getCurrent: () => number,
  vars: Record<string, unknown>,
  handlers: { sectionchange: Handler[] }
): DeckApi {
  return {
    goto: ctx.goto,
    next: ctx.next,
    prev: ctx.prev,
    toggleBlock: ctx.toggleBlock,
    setVar: (name, value) => { vars[name] = value; ctx.setVar(name, value); },
    getVar: (name) => vars[name],
    current: getCurrent,
    on: (event, handler) => {
      if (event === 'sectionchange') handlers.sectionchange.push(handler);
    },
    el: (id) => document.querySelector<HTMLElement>(`[data-block-id="${CSS.escape(id)}"]`),
  };
}

// Run user code with `Deck` in scope. Not a hard sandbox — a local, trusted-
// author tool. Errors are surfaced, not fatal.
export function runUserScript(code: string, api: DeckApi): void {
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('Deck', `"use strict";\n${code}`);
    fn(api);
  } catch (e) {
    console.error('[custom script error]', e);
  }
}
