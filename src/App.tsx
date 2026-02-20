
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { VideoDetailsPage } from './pages/VideoDetailsPage';
import { EventDetailsPage } from './pages/EventDetailsPage';
import { PaymentPage } from './pages/PaymentPage';
import { MyAccountPage } from './pages/MyAccountPage';
import { AdminLayout } from './components/layout/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminEventsPage } from './pages/admin/AdminEventsPage';
import { AdminEventVideosPage } from './pages/admin/AdminEventVideosPage';
import { AdminProductionPage } from './pages/admin/AdminProductionPage';

import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/event/:slug" element={<EventDetailsPage />} />
        <Route path="/video/:slug" element={<VideoDetailsPage />} />
        <Route path="/checkout" element={<PaymentPage />} />
        <Route path="/minha-conta" element={<MyAccountPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="events" element={<AdminEventsPage />} />
          <Route path="events/:eventId/videos" element={<AdminEventVideosPage />} />
          <Route path="production" element={<AdminProductionPage />} />
          <Route path="orders" element={<div className="p-8">Pedidos (Em construção)</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
