import { useMemo, useLayoutEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import renderMathInElement from 'katex/contrib/auto-render';
import 'katex/dist/katex.min.css';
import type { BlockDef, BlockRenderProps, BlockEditProps } from './types';

function Render({ block }: BlockRenderProps) {
  const md = String(block.props.md ?? '');
  const html = useMemo(() => DOMPurify.sanitize(marked.parse(md, { async: false }) as string), [md]);
  const ref = useRef<HTMLDivElement>(null);

  // Render LaTeX after sanitize: $$...$$ (display) and $...$ (inline). KaTeX
  // transforms the trusted DOM directly, so it doesn't fight DOMPurify.
  useLayoutEffect(() => {
    if (!ref.current) return;
    renderMathInElement(ref.current, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true },
      ],
      throwOnError: false,
      ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
    });
  }, [html]);

  return <div ref={ref} className="md-content" dangerouslySetInnerHTML={{ __html: html }} />;
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
