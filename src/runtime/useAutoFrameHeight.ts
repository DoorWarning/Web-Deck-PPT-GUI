import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

// Listens for the height report posted by buildSrcdoc's reporter script and
// returns the sandboxed iframe's content height. Matches the message to *this*
// iframe via event.source (the srcdoc origin is null, so we can't rely on it).
// Returns undefined until the first report arrives.
export function useAutoFrameHeight(ref: RefObject<HTMLIFrameElement | null>): number | undefined {
  const [h, setH] = useState<number>();
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (!d || !d.__deckFrame || !ref.current) return;
      if (e.source !== ref.current.contentWindow) return;
      setH(typeof d.h === 'number' ? d.h : undefined);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [ref]);
  return h;
}
