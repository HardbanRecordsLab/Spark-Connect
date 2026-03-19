import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // In production wire this to Sentry:
    // Sentry.captureException(error, { extra: info });
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen bg-radial-glow flex flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl mb-6">🔥</div>
        <h1 className="text-2xl font-black mb-2">Coś poszło nie tak</h1>
        <p className="text-muted-foreground text-sm mb-8 max-w-xs">
          Aplikacja napotkała nieoczekiwany błąd. Odśwież stronę — to zazwyczaj pomaga.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="gradient-fire text-primary-foreground font-bold px-6 py-3 rounded-2xl"
          >
            Odśwież stronę
          </button>
          <button
            onClick={() => this.setState({ error: null })}
            className="glass border border-border px-6 py-3 rounded-2xl text-sm"
          >
            Spróbuj ponownie
          </button>
        </div>
        {import.meta.env.DEV && (
          <pre className="mt-8 text-left text-xs text-destructive glass rounded-xl p-4 max-w-sm overflow-auto">
            {error.message}
          </pre>
        )}
      </div>
    );
  }
}
