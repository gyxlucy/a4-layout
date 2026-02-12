import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { useStore } from './store';

// Global keyboard shortcuts
document.addEventListener('keydown', (e) => {
  const store = useStore.getState();

  // Delete selected elements
  if (e.key === 'Delete' || e.key === 'Backspace') {
    // Don't intercept if focused on an input
    if (document.activeElement?.tagName === 'INPUT') return;
    e.preventDefault();
    store.removeSelectedElements();
  }

  // Cmd/Ctrl+D: duplicate selected
  if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
    e.preventDefault();
    store.duplicateSelected();
  }

  // Escape: clear selection
  if (e.key === 'Escape') {
    store.clearSelection();
  }

  // ]: bring to front
  if (e.key === ']') {
    if (document.activeElement?.tagName === 'INPUT') return;
    e.preventDefault();
    store.bringToFront();
  }

  // [: send to back
  if (e.key === '[') {
    if (document.activeElement?.tagName === 'INPUT') return;
    e.preventDefault();
    store.sendToBack();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
