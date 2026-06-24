/// <reference types="vite/client" />

// KaTeX auto-render contrib entry (types not always shipped).
declare module 'katex/contrib/auto-render' {
  interface RenderMathOptions {
    delimiters?: { left: string; right: string; display: boolean }[];
    throwOnError?: boolean;
    errorColor?: string;
    ignoredTags?: string[];
    ignoredClasses?: string[];
  }
  const renderMathInElement: (el: HTMLElement, options?: RenderMathOptions) => void;
  export default renderMathInElement;
}
