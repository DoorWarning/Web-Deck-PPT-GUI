import type { FC } from 'react';
import type { Block, BlockType } from '../model/types';

// Props passed to a block's visual renderer (shared by editor preview + present).
export interface BlockRenderProps {
  block: Block;
  mode: 'edit' | 'present';
  vars?: Record<string, unknown>;
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
}
