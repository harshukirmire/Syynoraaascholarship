import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let displayMessage = 'An unexpected error occurred while loading this view.';
    try {
      const parsed = JSON.parse(error.message) as { error?: string; operationType?: string };
      if (parsed?.error?.toLowerCase().includes('permission')) {
        displayMessage =
          'You do not have permission to access or modify this resource.';
      } else if (parsed?.error) {
        displayMessage = 'A data connection error occurred. Please refresh or sign in again.';
      }
    } catch {
      if (error.message && !error.message.includes('Firestore Error')) {
        displayMessage = error.message;
      }
    }
    return { hasError: true, message: displayMessage };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-zinc-200 rounded-xl p-8 text-center">
            <h1 className="text-xl font-semibold text-zinc-900 mb-2">
              Unable to display this page
            </h1>
            <p className="text-sm text-zinc-600 mb-6">{this.state.message}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.assign('/dashboard')}
                className="px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
              >
                Return to Dashboard
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-sm font-medium border border-zinc-300 text-zinc-800 rounded-lg hover:bg-zinc-50 transition-colors whitespace-nowrap shrink-0"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
