import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Defense-in-depth: silence browser extension errors (e.g. MetaMask inpage.js)
if (typeof window !== 'undefined') {
  const isExtensionNoise = (err, reason) => {
    try {
      const text = [
        err?.message,
        err?.stack,
        err?.name,
        typeof reason === 'string' ? reason : reason?.message,
        reason?.stack,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        text.includes('metamask') ||
        text.includes('chrome-extension://') ||
        text.includes('moz-extension://') ||
        text.includes('safari-extension://') ||
        text.includes('extension://') ||
        text.includes('failed to connect to metamask') ||
        text.includes('nkbihfbeogaeaoehlefnkodbefgpgknn') ||
        text.includes('inpage.js')
      );
    } catch {
      return false;
    }
  };

  window.addEventListener(
    'error',
    (e) => {
      if (isExtensionNoise(e.error, e.message) || (e.filename && e.filename.includes('extension://'))) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (e) => {
      if (isExtensionNoise(null, e.reason)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
