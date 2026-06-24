import { useEffect, useState, RefObject } from 'react';

// Returns true once the element has scrolled into view. When `enabled` is false
// it returns true immediately (no observation needed).
export function useInView(ref: RefObject<Element>, enabled: boolean): boolean {
  const [inView, setInView] = useState(!enabled);
  useEffect(() => {
    if (!enabled) { setInView(true); return; }
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setInView(true)),
      { threshold: 0.25 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [ref, enabled]);
  return inView;
}
