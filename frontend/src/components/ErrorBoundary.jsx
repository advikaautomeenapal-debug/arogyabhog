import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Arogya Bhog ErrorBoundary captured an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white dark:bg-[#1a1815] border-2 border-[#C9A227] rounded-3xl p-8 shadow-2xl space-y-5 animate-fadeIn">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-[#C9A227] flex items-center justify-center text-[#C9A227] shadow-inner">
              <AlertCircle className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-[#fdfbf7]">
                Notice Encountered
              </h2>
              <p className="text-xs text-gray-600 dark:text-[#a89f8d] leading-relaxed max-w-sm mx-auto">
                We encountered an unexpected display issue while preparing this page. Your shopping cart and saved information are securely preserved.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-left">
                <span className="text-[10px] font-mono text-gray-500 uppercase block mb-1">Details</span>
                <p className="text-xs font-mono text-rose-600 dark:text-rose-400 break-words line-clamp-2">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-[#383327] hover:border-[#C9A227] text-gray-800 dark:text-[#d0c5af] font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white dark:text-[#121212] font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-md transition-all"
              >
                <Home className="w-4 h-4" />
                <span>Return to Store</span>
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
