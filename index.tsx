
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

/**
 * High-level bootstrap with resiliency checks
 */
const bootstrap = () => {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error("Critical Failure: Root element not found.");
    return;
  }

  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Protocol: UI Mounted Successfully.");
  } catch (err) {
    console.error("React Mounting Error:", err);
    
    // Detailed Fallback for APK/WebView environments
    rootElement.innerHTML = `
      <div style="padding: 40px; text-align: center; font-family: 'Space Grotesk', sans-serif; background: #F8F9FD; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); borderRadius: 24px; display: flex; alignItems: center; justifyContent: center; color: white; fontSize: 32px; marginBottom: 24px; boxShadow: 0 20px 40px rgba(239, 68, 68, 0.3);">
          <i class="fa-solid fa-wifi"></i>
        </div>
        <h1 style="color: #1e293b; margin-bottom: 8px; font-weight: 900; text-transform: uppercase; font-size: 18px; letter-spacing: 1px;">Network Connectivity Blocked</h1>
        <p style="color: #64748b; font-size: 12px; max-width: 280px; line-height: 1.6; margin-bottom: 32px; font-weight: 500;">
          The system cannot load core modules. Ensure internet access is enabled and this application is permitted to reach external CDNs.
        </p>
        <div style="display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 240px;">
          <button onclick="location.reload();" style="padding: 16px; background: #6366f1; color: white; border: none; border-radius: 16px; font-weight: 700; cursor: pointer; text-transform: uppercase; font-size: 10px; letter-spacing: 0.1em; width: 100%;">Reconnect & Retry</button>
          <button onclick="localStorage.clear(); location.reload();" style="padding: 12px; background: transparent; color: #64748b; border: 1px solid #e2e8f0; border-radius: 16px; font-weight: 700; cursor: pointer; text-transform: uppercase; font-size: 9px; letter-spacing: 0.1em; width: 100%;">Full Cache Purge</button>
        </div>
      </div>
    `;
  }
};

// Initiate bootstrap once the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
