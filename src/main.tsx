import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

// Suppress MetaMask-related errors that might be coming from browser extensions or libraries
const suppressMetaMask = (error: any) => {
  const message = (error?.message || String(error)).toLowerCase();
  const keywords = ['metamask', 'ethereum', 'web3', 'failed to connect to metamask'];
  if (keywords.some(keyword => message.includes(keyword))) {
    return true;
  }
  return false;
};

window.addEventListener('unhandledrejection', (event) => {
  if (suppressMetaMask(event.reason)) {
    event.preventDefault();
    event.stopPropagation();
  }
});

window.addEventListener('error', (event) => {
  if (suppressMetaMask(event.error || event.message)) {
    event.preventDefault();
    event.stopPropagation();
  }
}, true);

// Patch all console methods to avoid showing these in the console
const patchConsole = (method: keyof Console) => {
  const original = console[method] as any;
  if (typeof original !== 'function') return;
  
  (console[method] as any) = (...args: any[]) => {
    const hasMetaMaskError = args.some(arg => {
      let str = '';
      if (typeof arg === 'string') {
        str = arg;
      } else if (arg instanceof Error) {
        str = arg.message || String(arg);
      } else if (arg && typeof arg === 'object') {
        try {
          str = JSON.stringify(arg);
        } catch (e) {
          str = String(arg);
        }
      } else {
        str = String(arg);
      }
      
      const lowerArg = str.toLowerCase();
      return ['metamask', 'ethereum', 'web3', 'failed to connect to metamask'].some(k => lowerArg.includes(k));
    });

    if (hasMetaMaskError) {
      return;
    }
    original.apply(console, args);
  };
};

(['error', 'warn', 'info', 'log', 'debug'] as const).forEach(patchConsole);

// Pre-emptively handle MetaMask/Web3 injection issues by defining them as undefined
// This can prevent some extensions from trying to connect if they see the property is already "handled"
try {
  if (!(window as any).ethereum) {
    Object.defineProperty(window, 'ethereum', {
      value: undefined,
      writable: false,
      configurable: false
    });
  }
  if (!(window as any).web3) {
    Object.defineProperty(window, 'web3', {
      value: undefined,
      writable: false,
      configurable: false
    });
  }
} catch (e) {
  // Ignore errors if properties are already defined and non-configurable
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
