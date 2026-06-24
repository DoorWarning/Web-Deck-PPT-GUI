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

// Open a file picker and parse a deck JSON. Resolves with the deck or rejects.
export function importJson(): Promise<Deck> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error('no file'));
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const deck = JSON.parse(String(reader.result)) as Deck;
          if (deck.version !== 2 || !Array.isArray(deck.sections)) {
            throw new Error('unsupported deck format');
          }
          // round-trip through serializer to normalize
          resolve(JSON.parse(serializeDeck(deck)));
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    };
    input.click();
  });
}
