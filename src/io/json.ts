import type { Deck } from '../model/types';
import { serializeDeck } from '../model/serialize';

export function exportJson(deck: Deck): void {
  const blob = new Blob([JSON.stringify(deck, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (deck.title || 'deck') + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Parse + validate a deck from raw JSON text (pasted or read from a file).
// Throws on invalid JSON or an unsupported format. Normalizes via the serializer.
export function parseDeckJson(text: string): Deck {
  const deck = JSON.parse(text) as Deck;
  if (deck.version !== 2 || !Array.isArray(deck.sections)) {
    throw new Error('지원하지 않는 형식입니다 (version 2 덱 JSON이 필요).');
  }
  return JSON.parse(serializeDeck(deck)) as Deck;
}

// Open a file picker and resolve with the file's text contents.
export function readTextFile(accept = 'application/json,.json'): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error('no file'));
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    };
    input.click();
  });
}

// Open a file picker and parse a deck JSON. Resolves with the deck or rejects.
export async function importJson(): Promise<Deck> {
  return parseDeckJson(await readTextFile());
}
