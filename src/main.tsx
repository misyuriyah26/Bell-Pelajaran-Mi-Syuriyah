import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { loadSchoolProfile } from './utils/storage';
import { updateAppIconsAndManifest } from './utils/pwaManifest';

// Immediately apply custom school logo, favicon, and dynamic PWA manifest on boot
try {
  const initialProfile = loadSchoolProfile();
  updateAppIconsAndManifest(initialProfile).catch(() => {});
} catch {
  // ignore
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register Service Worker for PWA (Progressive Web App / Chrome Install)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('SW registration notice:', err);
    });
  });
}


