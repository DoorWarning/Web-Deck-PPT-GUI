import type { Deck } from '../model/types';
import { serializeDeck } from '../model/serialize';

// Produce a fresh standalone HTML string: clone the live document, reset the
// React mount point, and overwrite ONLY the embedded deck-data block. Because
// the built file already has the runtime inlined, the result re-opens as a
// fully functional editor seeded with the saved deck (self-replicating).
export function buildStandaloneHtml(deck: Deck): string {
  const html = document.documentElement.cloneNode(true) as HTMLElement;

  // 1. Empty the React mount so the clone boots clean.
  const root = html.querySelector('#root');
  if (root) root.innerHTML = '';

  // 2. Drop any portal nodes libraries appended to <body>.
  html.querySelectorAll('[data-react-portal]').forEach((n) => n.remove());

  // 3. Inject the current deck JSON. Escape "</" so user text containing
  // "</script>" cannot terminate the embedded block early (JSON.parse reverses
  // the "<\/" escape transparently).
  const data = html.querySelector('#deck-data');
  if (data) data.textContent = serializeDeck(deck).replace(/<\//g, '<\\/');

  return '<!doctype html>\n' + html.outerHTML;
}

function triggerDownload(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeName(title: string): string {
  const base = title.trim().replace(/[\\/:*?"<>|]+/g, '_').slice(0, 60) || 'presentation';
  return base;
}

// Download a new editable standalone .html.
export function exportStandalone(deck: Deck): void {
  triggerDownload(`${safeName(deck.title)}.html`, buildStandaloneHtml(deck), 'text/html');
}
