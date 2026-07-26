import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

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
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Automatically reload once if it's a ChunkLoadError (caused by deploying a new version while user has app open)
    if (error.name === 'ChunkLoadError' || error.message.includes('dynamically imported module') || error.message.includes('Failed to fetch dynamically imported module')) {
      const hasReloaded = sessionStorage.getItem('chunk_reloaded');
      if (!hasReloaded) {
        sessionStorage.setItem('chunk_reloaded', 'true');
        window.location.reload();
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
          <div className="bg-black border border-brand-red/30 p-8 rounded-2xl max-w-lg w-full text-center shadow-xl">
            <div className="w-16 h-16 bg-brand-red/20 text-brand-orange rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black font-heading uppercase tracking-widest text-white mb-2">Ops! Algo deu errado</h2>
            <p className="text-gray-400 mb-6 text-sm">
              Tivemos um problema inesperado ao carregar esta página. Pode ser uma atualização no sistema.
            </p>
            
            <div className="bg-brand-dark p-4 rounded-xl text-left border border-gray-800 mb-6 overflow-x-auto">
                <p className="text-xs text-red-400 font-mono break-words">
                    {this.state.error?.toString()}
                </p>
            </div>

            <button
              onClick={() => {
                sessionStorage.removeItem('chunk_reloaded');
                window.location.reload();
              }}
              className="px-6 py-3 bg-gradient-to-r from-brand-red to-brand-orange text-white rounded-xl font-black font-heading uppercase tracking-widest text-sm hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-2 w-full"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
