import React, { Component, ErrorInfo, ReactNode } from 'react';
import { GoPlayLogo } from './GoPlayLogo';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GoPlay ErrorBoundary] Uncaught render error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white text-[#17202A] flex flex-col items-center justify-center p-6 text-center select-none font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="bg-white p-3.5 rounded-2xl shadow-md border border-slate-100 mb-4 flex items-center justify-center">
            <GoPlayLogo size="lg" />
          </div>
          <h2 className="text-xl font-black text-slate-800">Something went wrong</h2>
          <p className="text-xs text-slate-500 mt-2 max-w-xs font-medium">
            An unexpected error occurred while loading this view. Please try reloading or returning to the home screen.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-colors cursor-pointer"
            >
              Go to Home
            </button>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-xl bg-[#8BCB3D] hover:bg-[#7cb934] text-white text-xs font-black transition-colors cursor-pointer shadow-xs"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
