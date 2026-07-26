
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

function safeLazy<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() =>
    factory().catch((err) => {
      console.error('Dynamic import failed, reloading page...', err);
      const key = 'chunk_reload_count';
      const reloadCount = parseInt(sessionStorage.getItem(key) || '0', 10);
      if (reloadCount < 2) {
        sessionStorage.setItem(key, String(reloadCount + 1));
        window.location.reload();
      }
      throw err;
    })
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('App ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-2xl max-w-md w-full">
            <h1 className="text-xl font-black uppercase font-heading text-brand-orange mb-3">
              Recarregando Aplicação
            </h1>
            <p className="text-gray-400 text-xs mb-6 leading-relaxed">
              Ocorreu uma atualização nos arquivos da aplicação. Clique no botão abaixo para recarregar com a versão mais recente.
            </p>
            <button
              onClick={() => {
                sessionStorage.clear();
                window.location.href = '/';
              }}
              className="w-full py-3 bg-gradient-to-r from-brand-red to-brand-orange text-white text-xs font-black font-heading uppercase tracking-widest rounded-xl hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all"
            >
              Recarregar Página Inicial
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const HomePage = safeLazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })));
const VideoDetailsPage = safeLazy(() => import('./pages/VideoDetailsPage').then(module => ({ default: module.VideoDetailsPage })));
const EventDetailsPage = safeLazy(() => import('./pages/EventDetailsPage').then(module => ({ default: module.EventDetailsPage })));
const PaymentPage = safeLazy(() => import('./pages/PaymentPage').then(module => ({ default: module.PaymentPage })));
const MyAccountPage = safeLazy(() => import('./pages/MyAccountPage').then(module => ({ default: module.MyAccountPage })));
const HelpPage = safeLazy(() => import('./pages/HelpPage').then(module => ({ default: module.HelpPage })));
const TermsPage = safeLazy(() => import('./pages/TermsPage').then(module => ({ default: module.TermsPage })));

const AdminLayout = safeLazy(() => import('./components/layout/AdminLayout').then(module => ({ default: module.AdminLayout })));
const AdminRoute = safeLazy(() => import('./components/auth/AdminRoute').then(module => ({ default: module.AdminRoute })));
const AdminDashboardPage = safeLazy(() => import('./pages/admin/AdminDashboardPage').then(module => ({ default: module.AdminDashboardPage })));
const AdminEventsPage = safeLazy(() => import('./pages/admin/AdminEventsPage').then(module => ({ default: module.AdminEventsPage })));
const AdminEventVideosPage = safeLazy(() => import('./pages/admin/AdminEventVideosPage').then(module => ({ default: module.AdminEventVideosPage })));
const AdminProductionPage = safeLazy(() => import('./pages/admin/AdminProductionPage').then(module => ({ default: module.AdminProductionPage })));
const AdminSettingsPage = safeLazy(() => import('./pages/admin/AdminSettingsPage').then(module => ({ default: module.AdminSettingsPage })));
const AdminOrdersPage = safeLazy(() => import('./pages/admin/AdminOrdersPage').then(module => ({ default: module.AdminOrdersPage })));
const AdminCouponsPage = safeLazy(() => import('./pages/admin/AdminCouponsPage').then(module => ({ default: module.AdminCouponsPage })));
const AdminUsersPage = safeLazy(() => import('./pages/admin/AdminUsersPage').then(module => ({ default: module.AdminUsersPage })));

const LoginPage = safeLazy(() => import('./pages/auth/LoginPage').then(module => ({ default: module.LoginPage })));
const SignupPage = safeLazy(() => import('./pages/auth/SignupPage').then(module => ({ default: module.SignupPage })));
const ResetPasswordPage = safeLazy(() => import('./pages/auth/ResetPasswordPage').then(module => ({ default: module.ResetPasswordPage })));
const UpdatePasswordPage = safeLazy(() => import('./pages/auth/UpdatePasswordPage').then(module => ({ default: module.UpdatePasswordPage })));

const PageLoader = () => (
  <div className="min-h-screen bg-brand-dark flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/update-password" element={<UpdatePasswordPage />} />
            <Route path="/event/:slug" element={<EventDetailsPage />} />
            <Route path="/video/:slug" element={<VideoDetailsPage />} />
            <Route path="/checkout" element={<PaymentPage />} />
            <Route path="/minha-conta" element={<MyAccountPage />} />
            <Route path="/ajuda" element={<HelpPage />} />
            <Route path="/termos" element={<TermsPage />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="events" element={<AdminEventsPage />} />
                <Route path="events/:eventId/videos" element={<AdminEventVideosPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="production" element={<AdminProductionPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="coupons" element={<AdminCouponsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
