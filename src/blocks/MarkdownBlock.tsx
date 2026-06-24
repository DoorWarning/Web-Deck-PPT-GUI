import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { BlockDef, BlockRenderProps, BlockEditProps } from './types';

function Render({ block }: BlockRenderProps) {
  const md = String(block.props.md ?? '');
  const html = useMemo(() => DOMPurify.sanitize(marked.parse(md, { async: false }) as string), [md]);
  return <div className="md-content" dangerouslySetInnerHTML={{ __html: html }} />;
}

function Edit({ block, update }: BlockEditProps) {
  return (
    <label className="field col">
      <span>마크다운</span>
      <textarea
        className="mono"
        rows={10}
        value={String(block.props.md ?? '')}
        onChange={(e) => update({ md: e.target.value })}
      />
    </label>
  );
}

export const markdownBlock: BlockDef = { type: 'markdown', label: '텍스트', icon: '📝', Render, Edit };
