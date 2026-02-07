import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log('Mounting React application...');
const rootElement = document.getElementById('root');
console.log('Root element:', rootElement);
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
