
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
    rootElement.innerHTML = `
      <div style="padding: 40px; text-align: center; font-family: sans-serif;">
        <h1 style="color: #ef4444;">Protocol Error</h1>
        <p>The application failed to initialize. Please check the system console.</p>
        <button onclick="localStorage.clear(); location.reload();" style="padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 8px; cursor: pointer;">Clear Cache & Reset</button>
      </div>
    `;
  }
}
