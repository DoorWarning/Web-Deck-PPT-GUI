import { useEffect, useState } from 'react';

// Live viewport-width check so the app can swap between the desktop 3-column
// layout and the mobile shell, switching in real time on resize/rotate.
export function useIsMobile(query = '(max-width: 768px)') {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    onChange();
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}
