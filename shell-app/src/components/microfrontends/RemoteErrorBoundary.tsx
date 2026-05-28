'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Layers } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackName?: string;
  onUseMock?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RemoteErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Remote boundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[450px] p-6 text-center bg-gray-950/60 border border-cyan-500/10 rounded-2xl backdrop-blur-md max-w-2xl mx-auto my-8">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-accent-rose mb-6 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse">
            <ShieldAlert size={32} />
          </div>
          
          <h2 className="text-xl font-bold text-gray-100 uppercase tracking-widest font-sans">
            Remote Grid Connection Interrupted
          </h2>
          
          <p className="text-sm text-gray-400 mt-3 max-w-md leading-relaxed">
            The external microfrontend <span className="text-accent-cyan font-medium">{this.props.fallbackName || 'Component'}</span> could not be loaded via the Module Federation protocol.
          </p>

          {this.state.error && (
            <div className="w-full mt-4 p-3 bg-gray-900 border border-gray-800 rounded-lg text-left overflow-x-auto max-h-24">
              <code className="text-[10px] text-accent-rose font-mono">
                {this.state.error.message || 'ChunkLoadError: Loading chunk failed.'}
              </code>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full justify-center">
            <button
              onClick={this.handleReset}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 border border-cyan-500/20 text-xs font-semibold text-gray-300 hover:text-white hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all cursor-pointer"
            >
              <RefreshCw size={14} className="animate-spin-slow" />
              <span>Retry Grid Link</span>
            </button>

            {this.props.onUseMock && (
              <button
                onClick={this.props.onUseMock}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-accent-cyan to-accent-indigo text-xs font-semibold text-white hover:brightness-110 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
              >
                <Layers size={14} />
                <span>Override with Simulation</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
