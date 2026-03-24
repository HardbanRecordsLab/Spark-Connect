import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null; errorInfo: string }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, errorInfo: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[SparkConnect] Error boundary caught:', error, info);
    this.setState({ errorInfo: info.componentStack });
    // Wire to Sentry in production:
    // Sentry.captureException(error, { extra: info });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
          style={{ background: 'hsl(240 15% 4%)' }}>
          <div className="text-6xl mb-4">😵</div>
          <h1 className="text-xl font-bold text-white mb-2">Coś poszło nie tak</h1>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,.5)' }}>
            Aplikacja napotkała nieoczekiwany błąd. Odśwież stronę aby spróbować ponownie.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 rounded-2xl font-bold text-sm text-white mb-3"
            style={{ background: 'linear-gradient(135deg,hsl(347 100% 65%),hsl(35 100% 65%))' }}>
            Odśwież aplikację 🔄
          </button>
          <button
            onClick={() => this.setState({ error: null, errorInfo: '' })}
            className="text-xs px-4 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,.07)', color: 'rgba(255,255,255,.5)' }}>
            Spróbuj ponownie
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left max-w-sm">
              <summary className="text-xs cursor-pointer" style={{ color: 'rgba(255,255,255,.3)' }}>
                Szczegóły błędu (dev)
              </summary>
              <pre className="text-xs mt-2 p-3 rounded-xl overflow-auto max-h-40"
                style={{ background: 'rgba(255,255,255,.05)', color: 'rgba(255,80,80,.8)' }}>
                {this.state.error.toString()}
                {this.state.errorInfo}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
