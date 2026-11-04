import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// PWA: registra o service worker apenas em build de produção/preview.
// Em dev (Vite HMR) não registra para evitar cache stale no preview da Arena.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* protótipo: falha de SW não bloqueia o app */
    });
  });
}
