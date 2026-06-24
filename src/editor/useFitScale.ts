import { useEffect, useState, RefObject } from 'react';

// Computes the scale needed to fit a fixed w×h canvas inside a container,
// recomputing on container resize.
export function useFitScale(ref: RefObject<HTMLElement>, w: number, h: number, pad = 48): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const recompute = () => {
      const cw = node.clientWidth - pad;
      const ch = node.clientHeight - pad;
      if (cw <= 0 || ch <= 0) return;
      setScale(Math.min(cw / w, ch / h));
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(node);
    return () => ro.disconnect();
  }, [ref, w, h, pad]);

  return scale;
}
