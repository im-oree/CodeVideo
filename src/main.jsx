import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource/fira-code/400.css';
import '@fontsource/fira-code/500.css';
import '@fontsource/fira-code/600.css';
import './index.css';
import App from './App';

function Root() {
  const [appSettings, setAppSettings] = useState({ appTheme: 'dark', accentHex: '#6366f1' });
  return (
    <App
      appTheme={appSettings.appTheme}
      accentHex={appSettings.accentHex}
      onAppSettings={(p) => setAppSettings((s) => ({ ...s, ...p }))}
    />
  );
}

createRoot(document.getElementById('root')).render(<React.StrictMode><Root /></React.StrictMode>);
