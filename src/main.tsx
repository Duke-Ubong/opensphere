/// <reference types="vite/client" />
import React, { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ClerkProvider } from '@clerk/clerk-react';

class ErrorBoundary extends React.Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  state = { hasError: false, error: null as Error | null };

  constructor(props: {children: ReactNode}) {
    super(props);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#131313] text-white flex items-center justify-center p-4 font-mono">
          <div className="max-w-2xl bg-[#1A1A1A] p-6 rounded-xl border border-red-500/30 overflow-auto">
            <h1 className="text-xl font-bold text-red-400 mb-4">Application Error</h1>
            <pre className="text-xs text-red-300 whitespace-pre-wrap">
              {this.state.error?.toString()}
              {'\n\n'}
              {this.state.error?.stack}
            </pre>
          </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  createRoot(document.getElementById('root')!).render(
    <div className="min-h-screen bg-[#131313] text-white flex items-center justify-center p-4 font-mono">
      <div className="max-w-md bg-[#1A1A1A] p-6 rounded-xl border border-red-500/30">
        <h1 className="text-xl font-bold text-red-400 mb-4">Missing Clerk Publishable Key</h1>
        <p className="text-sm text-gray-400 mb-4">
          To use Clerk authentication, you need to add your Publishable Key to the environment variables.
        </p>
        <p className="text-sm text-gray-400 mb-4">
          1. Create a project at <a href="https://clerk.com" className="text-[#00FFAB] underline" target="_blank" rel="noreferrer">clerk.com</a><br/>
          2. Get your Publishable Key<br/>
          3. Add it as <code className="bg-black px-1 py-0.5 rounded text-[#00FFAB]">VITE_CLERK_PUBLISHABLE_KEY</code> in the Secrets menu.
        </p>
      </div>
    </div>
  );
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
          <App />
        </ClerkProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
}
