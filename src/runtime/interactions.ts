import type { Interaction, Block } from '../model/types';

// Shared interaction engine for present mode. `ctx` supplies navigation /
// visibility / variable hooks so this stays framework-agnostic.
export interface InteractionContext {
  goto: (section1Based: number) => void;
  next: () => void;
  prev: () => void;
  toggleBlock: (targetId: string) => void;
  setVar: (name: string, value: unknown) => void;
  runScript: (code: string) => void;
}

export function runInteraction(it: Interaction, ctx: InteractionContext): void {
  switch (it.action) {
    case 'goto':
      ctx.goto(Number(it.params.section) || 1);
      break;
    case 'next':
      ctx.next();
      break;
    case 'prev':
      ctx.prev();
      break;
    case 'toggleBlock':
      if (it.params.targetId) ctx.toggleBlock(String(it.params.targetId));
      break;
    case 'setVar':
      if (it.params.name) ctx.setVar(String(it.params.name), it.params.value);
      break;
    case 'openUrl':
      if (it.params.url) window.open(String(it.params.url), '_blank', 'noopener');
      break;
    case 'runScript':
      if (it.params.code) ctx.runScript(String(it.params.code));
      break;
  }
}

export function blockClickInteractions(b: Block): Interaction[] {
  return b.interactions.filter((i) => i.on === 'click');
}

export function isClickable(b: Block): boolean {
  return b.interactions.some((i) => i.on === 'click');
}
