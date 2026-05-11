import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress wallet extension conflicts (e.g. Zerion) from crashing the Vite preview
window.addEventListener('error', (e) => {
  if (e.message && (e.message.includes('isZerion') || e.message.includes('Cannot redefine property'))) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (e) => {
  if (e.reason && e.reason.message && (e.reason.message.includes('isZerion') || e.reason.message.includes('Cannot redefine property'))) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
