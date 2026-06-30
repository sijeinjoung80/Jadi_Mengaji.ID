import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global Fetch Interceptor to route /api requests to the live Cloud Run backend
// ONLY when hosted on external custom domains (such as Vercel).
// This avoids modifying window.fetch inside the AI Studio preview iframe sandbox (ending in .run.app or .google.com)
// or localhost, ensuring that the development environment always loads flawlessly.
const hostname = window.location.hostname;
const isPlatformDomain = hostname.endsWith(".run.app") || hostname.endsWith(".google.com");
const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

if (!isPlatformDomain && !isLocalhost) {
  const originalFetch = window.fetch;
  try {
    (window as any).fetch = function (input: any, init: any) {
      let url = "";
      if (typeof input === "string") {
        url = input;
      } else if (input instanceof URL) {
        url = input.toString();
      } else if (input && typeof input === "object" && "url" in input) {
        url = (input as any).url;
      }

      if (url.startsWith("/api/")) {
        let apiRoot = "";
        const metaEnv = (import.meta as any).env;
        if (metaEnv && metaEnv.VITE_API_URL) {
          apiRoot = metaEnv.VITE_API_URL;
        } else {
          // Automatically default to the actual Cloud Run shared app backend
          apiRoot = "https://ais-pre-s36un5myj4fhmkzzdye2zi-890812653025.asia-east1.run.app";
        }

        if (apiRoot) {
          if (apiRoot.endsWith("/")) {
            apiRoot = apiRoot.slice(0, -1);
          }
          url = apiRoot + url;

          if (typeof input === "string") {
            return originalFetch(url, init);
          } else if (input instanceof URL) {
            return originalFetch(new URL(url), init);
          } else {
            const newRequest = new Request(url, input);
            return originalFetch(newRequest, init);
          }
        }
      }

      return originalFetch(input, init);
    };
  } catch (e) {
    console.error("Failed to intercept global fetch for external domain:", e);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
