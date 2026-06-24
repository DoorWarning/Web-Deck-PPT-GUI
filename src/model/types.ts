// Data model for a web-page-style interactive presentation.
// Deck -> Section[] -> Block[]. Blocks lay out in responsive flow/grid (NOT
// absolute coordinates); each section is one "screen" of the talk.

// 'free' = blocks are absolutely positioned (drag/resize anywhere); the others
// arrange blocks in normal document flow.
export type SectionLayout = 'free' | 'flow' | 'center' | 'split' | 'grid' | 'fixed';

export type BlockType =
  | 'markdown'
  | 'media'
  | 'chart'
  | 'poll'
  | 'playground'
  | 'embed'
  | 'customCode';

export type InteractionEvent = 'click' | 'scroll' | 'step';

export type InteractionAction =
  | 'goto'        // params: { section: number } 1-based
  | 'next'
  | 'prev'
  | 'toggleBlock' // params: { targetId }
  | 'setVar'      // params: { name, value }
  | 'openUrl'     // params: { url }
  | 'runScript';  // params: { code }

export interface Interaction {
  id: string;
  on: InteractionEvent;
  action: InteractionAction;
  params: Record<string, unknown>;
}

// Per-block reveal/animation. `step` groups blocks into fragment stages that
// appear one-by-one as the presenter advances; `on:'scroll'` triggers when the
// block scrolls into view.
export interface BlockAnim {
  reveal?: 'fade' | 'rise' | 'zoom' | 'none';
  step?: number;            // fragment order within the section (0 = always visible)
  on?: 'load' | 'scroll';   // when the reveal plays
}

export interface BlockLayout {
  // --- flow placement ---
  width?: 'auto' | 'full' | 'half' | 'third' | 'twothird'; // quick preset
  widthPct?: number; // manual width %, overrides preset when set (1..100)
  align?: 'start' | 'center' | 'end';
  col?: number; // explicit grid column span (grid layout)

  // --- free placement ---
  // 'flow' (default) stacks in the responsive column; 'absolute' positions the
  // block anywhere on the section using percentage coordinates (stays
  // responsive across screen sizes).
  position?: 'flow' | 'absolute';
  xPct?: number; // left, 0..100 of section width
  yPct?: number; // top, 0..100 of section height
  // Free-resize model:
  //  - widthPct: box width (e/w handles reflow content to it)
  //  - heightPct: explicit box height (n/s handles set/grow it; auto when unset)
  //  - scale: uniform content scale from corner handles (default 1)
  heightPct?: number;
  scale?: number;
  z?: number;    // paint order for absolute blocks
}

// Per-block typography overrides (inherits deck theme when unset).
export interface BlockStyle {
  fontFamily?: string; // CSS font-family stack
  color?: string;      // text color
  fontSize?: number;   // base font size in px (cascades to block content)
  textAlign?: 'left' | 'center' | 'right'; // text alignment inside the block
}

export interface Block {
  id: string;
  type: BlockType;
  // Block-type-specific config. Each block defines its own props shape; see
  // src/blocks/<type>.tsx and the JSON schema in src/model/schema.ts.
  props: Record<string, unknown>;
  layout: BlockLayout;
  anim: BlockAnim;
  style?: BlockStyle;
  interactions: Interaction[];
  hidden?: boolean; // runtime visibility (toggleBlock target)
}

export type TransitionKind = 'none' | 'fade' | 'slide' | 'zoom';

export interface Section {
  id: string;
  layout: SectionLayout;
  background: string; // CSS color/gradient
  color?: string;     // default text color
  transition: TransitionKind;
  blocks: Block[];
  notes: string;
  padding?: number;   // inner padding in px (responsive cap applied in CSS)
}

export interface DeckTheme {
  fontFamily: string;
  headingFamily?: string;
  accent: string;
  maxWidth: number; // content max width in px (web-page readable column)
}

export interface Deck {
  version: 2;
  id: string;
  title: string;
  theme: DeckTheme;
  canvas: { w: number; h: number }; // presentation resolution (e.g. 1280×720)
  sections: Section[];
  scripts: string[]; // global custom JS run in present mode
}

export type AppMode = 'edit' | 'present';
