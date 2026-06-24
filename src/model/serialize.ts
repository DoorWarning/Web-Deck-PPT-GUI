import type { Deck } from './types';
import { defaultDeck } from './defaults';

const DECK_DATA_ID = 'deck-data';

// Read the embedded deck from <script id="deck-data">. Returns a default deck
// if missing/empty/invalid. Used by both the dev app and exported single file.
export function readEmbeddedDeck(): Deck {
  const el = document.getElementById(DECK_DATA_ID);
  if (!el) return defaultDeck();
  const raw = el.textContent?.trim();
  if (!raw || raw === 'null') return defaultDeck();
  try {
    return migrate(JSON.parse(raw));
  } catch (e) {
    console.warn('deck-data parse failed, using default deck', e);
    return defaultDeck();
  }
}

export function serializeDeck(deck: Deck): string {
  return JSON.stringify(deck);
}

// Pretty JSON for human/AI-friendly source files and JSON export.
export function serializeDeckPretty(deck: Deck): string {
  return JSON.stringify(deck, null, 2);
}

function migrate(data: unknown): Deck {
  const deck = data as Deck;
  if (!deck || deck.version !== 2 || !Array.isArray(deck.sections)) {
    throw new Error('unsupported deck format (expected version 2)');
  }
  return deck;
}
