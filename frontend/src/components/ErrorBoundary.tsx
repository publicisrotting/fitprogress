import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, ShieldAlert } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-slate-950 p-8 text-center relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-[-10%] right-[-10%] w-[60%] aspect-square bg-red-600/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square bg-orange-600/5 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10 animate-fade-in-up">
            <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 backdrop-blur-md">
              <ShieldAlert className="w-12 h-12 text-red-500" />
            </div>
            
            <h2 className="text-3xl font-black text-white tracking-tight mb-4">Ой, щось пішло не так</h2>
            
            <div className="bg-white/5 border border-white/5 rounded-[2rem] p-6 mb-10 backdrop-blur-md max-w-sm mx-auto">
              <div className="flex items-center gap-3 text-red-400 mb-3 justify-center">
                <AlertCircle className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Деталі помилки</span>
              </div>
              <p className="text-white/40 text-sm font-medium leading-relaxed italic">
                {this.state.error?.message || 'Сталася непередбачена помилка'}
              </p>
            </div>

            <button
              className="group flex items-center gap-3 px-10 py-5 bg-white text-slate-950 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-white/5 active:scale-[0.98] transition-all mx-auto"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              <RefreshCw className="w-4 h-4 group-active:rotate-180 transition-transform duration-500" />
              <span>Перезавантажити</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
