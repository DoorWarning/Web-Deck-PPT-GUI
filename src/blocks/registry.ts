import type { BlockType } from '../model/types';
import type { BlockDef } from './types';
import { markdownBlock } from './MarkdownBlock';
import { mediaBlock } from './MediaBlock';
import { chartBlock } from './ChartBlock';
import { pollBlock } from './PollBlock';
import { playgroundBlock } from './PlaygroundBlock';
import { embedBlock } from './EmbedBlock';
import { customCodeBlock } from './CustomCodeBlock';

// Single source of truth: block type -> definition (renderer + editor + meta).
export const BLOCKS: Record<BlockType, BlockDef> = {
  markdown: markdownBlock,
  media: mediaBlock,
  chart: chartBlock,
  poll: pollBlock,
  playground: playgroundBlock,
  embed: embedBlock,
  customCode: customCodeBlock,
};

export const BLOCK_LIST: BlockDef[] = Object.values(BLOCKS);

export function getBlockDef(type: BlockType): BlockDef {
  return BLOCKS[type];
}
