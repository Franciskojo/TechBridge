import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

// ── Global Error Boundary ─────────────────────────────────────────────────────
// Catches any unhandled React render errors and shows a recovery screen
// instead of a black/blank page.
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message };
  }

  handleReset = () => {
    // Clear all TechBridge auth keys and reload
    localStorage.removeItem('techbridge_token');
    localStorage.removeItem('techbridge_user');
    localStorage.removeItem('techbridge_session_at');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#020817',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
          color: '#e2e8f0',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: '#2563eb', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 900, fontSize: 20,
            color: '#fff', marginBottom: 24, letterSpacing: -1,
          }}>TB</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
            TechBridge encountered an error
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', maxWidth: 400, marginBottom: 24 }}>
            {this.state.errorMessage || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              background: '#2563eb', color: '#fff', border: 'none',
              borderRadius: 10, padding: '10px 24px', fontSize: 13,
              fontWeight: 700, cursor: 'pointer',
            }}
          >
            Clear Session &amp; Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── React Query Client ────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,       // 2 minutes
      gcTime: 1000 * 60 * 10,         // 10 minutes
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
)

