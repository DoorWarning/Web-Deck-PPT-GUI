import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// The deck itself is read from the embedded <script id="deck-data"> block
// inside the store (readEmbeddedDeck), so there is no async bootstrap here.
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
