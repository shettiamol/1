
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Critical Failure: Root element not found in DOM.");
} else {
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error("React Mounting Error:", err);
    // Fallback UI in case of extreme bootstrapping failure
    rootElement.innerHTML = `
      <div style="padding: 40px; text-align: center; font-family: 'Space Grotesk', sans-serif; background: #F8F9FD; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); borderRadius: 24px; display: flex; alignItems: center; justifyContent: center; color: white; fontSize: 32px; marginBottom: 24px; boxShadow: 0 20px 40px rgba(99, 102, 241, 0.3);">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h1 style="color: #1e293b; margin-bottom: 8px;">Protocol Initialization Error</h1>
        <p style="color: #64748b; font-size: 14px; max-width: 300px; line-height: 1.6; margin-bottom: 32px;">The ledger was unable to synchronize with the local environment. This is often caused by a system cache mismatch.</p>
        <button onclick="localStorage.clear(); location.reload();" style="padding: 16px 32px; background: #6366f1; color: white; border: none; border-radius: 16px; font-weight: 700; cursor: pointer; text-transform: uppercase; font-size: 11px; letter-spacing: 0.1em; transition: all 0.2s;">Wipe Cache & Hard Reset</button>
      </div>
    `;
  }
}
