'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error('UI ErrorBoundary caught:', error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-screen items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center text-2xl">!</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Une erreur est survenue</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              L&apos;application a rencontré un problème inattendu. Vous pouvez réessayer ou recharger la page.
            </p>
            <details className="text-left text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-950 p-3 rounded-lg overflow-auto max-h-40">
              <summary className="cursor-pointer font-medium">Détails techniques</summary>
              <pre className="whitespace-pre-wrap mt-2">{this.state.error.message}</pre>
            </details>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={this.reset}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Réessayer
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                Recharger
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
