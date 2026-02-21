
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

const HomePage = lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })));
const VideoDetailsPage = lazy(() => import('./pages/VideoDetailsPage').then(module => ({ default: module.VideoDetailsPage })));
const EventDetailsPage = lazy(() => import('./pages/EventDetailsPage').then(module => ({ default: module.EventDetailsPage })));
const PaymentPage = lazy(() => import('./pages/PaymentPage').then(module => ({ default: module.PaymentPage })));
const MyAccountPage = lazy(() => import('./pages/MyAccountPage').then(module => ({ default: module.MyAccountPage })));
const HelpPage = lazy(() => import('./pages/HelpPage').then(module => ({ default: module.HelpPage })));

const AdminLayout = lazy(() => import('./components/layout/AdminLayout').then(module => ({ default: module.AdminLayout })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(module => ({ default: module.AdminDashboardPage })));
const AdminEventsPage = lazy(() => import('./pages/admin/AdminEventsPage').then(module => ({ default: module.AdminEventsPage })));
const AdminEventVideosPage = lazy(() => import('./pages/admin/AdminEventVideosPage').then(module => ({ default: module.AdminEventVideosPage })));
const AdminProductionPage = lazy(() => import('./pages/admin/AdminProductionPage').then(module => ({ default: module.AdminProductionPage })));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage').then(module => ({ default: module.AdminSettingsPage })));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage').then(module => ({ default: module.AdminOrdersPage })));

const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(module => ({ default: module.LoginPage })));
const SignupPage = lazy(() => import('./pages/auth/SignupPage').then(module => ({ default: module.SignupPage })));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/event/:slug" element={<EventDetailsPage />} />
          <Route path="/video/:slug" element={<VideoDetailsPage />} />
          <Route path="/checkout" element={<PaymentPage />} />
          <Route path="/minha-conta" element={<MyAccountPage />} />
          <Route path="/ajuda" element={<HelpPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="events" element={<AdminEventsPage />} />
            <Route path="events/:eventId/videos" element={<AdminEventVideosPage />} />
            <Route path="production" element={<AdminProductionPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
