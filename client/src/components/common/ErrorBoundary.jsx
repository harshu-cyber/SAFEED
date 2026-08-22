import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[SAFEED-UP ErrorBoundary Caught Exception]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#071A2F] text-white p-6 flex flex-col items-center justify-center font-sans">
          <div className="max-w-3xl w-full bg-[#0B223D] border-2 border-rose-500/80 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-rose-500/30 pb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-black text-xl">
                ⚠️
              </div>
              <div>
                <h1 className="text-xl font-black text-rose-400">SAFEED-UP System Diagnostic Error</h1>
                <p className="text-xs text-slate-400 font-bold">A runtime component exception occurred while rendering this view.</p>
              </div>
            </div>

            <div className="bg-[#040910] p-4 rounded-xl border border-rose-950 font-mono text-xs text-rose-300 overflow-x-auto space-y-2">
              <p className="font-bold text-rose-400">Error Name: {this.state.error?.name || 'Error'}</p>
              <p className="font-bold text-white">Message: {this.state.error?.message || 'Unknown Exception'}</p>
              {this.state.error?.stack && (
                <details className="mt-2 cursor-pointer">
                  <summary className="text-[11px] text-slate-400 font-sans hover:text-white">View Call Stack</summary>
                  <pre className="mt-2 text-[10px] text-slate-400 whitespace-pre-wrap font-mono leading-relaxed">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              {this.state.errorInfo?.componentStack && (
                <details className="mt-2 cursor-pointer">
                  <summary className="text-[11px] text-slate-400 font-sans hover:text-white">View Component Stack</summary>
                  <pre className="mt-2 text-[10px] text-amber-300/80 whitespace-pre-wrap font-mono leading-relaxed">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-amber-500 text-[#071A2F] font-black text-xs rounded-xl shadow-lg hover:opacity-90 transition cursor-pointer"
              >
                🔄 Reload System Portal
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/auth/login';
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                🚪 Reset Session & Login Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
