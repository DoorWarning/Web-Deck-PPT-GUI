import type { FC } from 'react';
import type { Block, BlockType } from '../model/types';

// Props passed to a block's visual renderer (shared by editor preview + present).
export interface BlockRenderProps {
  block: Block;
  mode: 'edit' | 'present';
  vars?: Record<string, unknown>;
  // For `fill` blocks: true once the block has an explicit box height, so the
  // content should fill it (height:100%) instead of using its content height.
  fillHeight?: boolean;
}

// Props passed to a block's inspector editor.
export interface BlockEditProps {
  block: Block;
  update: (patch: Record<string, unknown>) => void;
}

export interface BlockDef {
  type: BlockType;
  label: string;
  icon: string; // emoji glyph for palette
  Render: FC<BlockRenderProps>;
  Edit: FC<BlockEditProps>;
  // Box-sizing blocks (iframe-backed: customCode, playground, embed). Their
  // content fills the box and reflows on resize instead of being zoom-scaled.
  // Corner-resize then changes the box width/height rather than a scale factor.
  fill?: boolean;
}
