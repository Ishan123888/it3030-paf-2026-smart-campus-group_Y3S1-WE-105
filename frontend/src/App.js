import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import OAuthCallback from './pages/OAuthCallback';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import UserManagement from './pages/admin/UserManagement';
import AdminOverview from './pages/admin/AdminOverview';
import AdminIncidentsPage from './pages/admin/AdminIncidentsPage';
import AdminEditProfile from './pages/admin/AdminEditProfile';
import AddAdmin from './pages/admin/AddAdmin';
import ResourcesPage from './pages/ResourcesPage';
import AdminResourcesPage from './pages/AdminResourcesPage';
import Contact from './pages/Contact';
import StudentBookingsPage from './pages/StudentBookingsPage';
import StudentBookingFormPage from './pages/StudentBookingFormPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';

import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// ✅ Navbar සහ Footer වෙනම component එකක් — location access කරන්න
function AppLayout() {
  const location = useLocation();
  
  // මේ pages වලදී Navbar/Footer පෙන්වන්න එපා
  const hideLayout = ['/login', '/oauth-callback', '/admin/login'].includes(location.pathname)
    || location.pathname.startsWith('/admin/')
    || location.pathname === '/admin';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: "var(--bg)", color: "var(--text)" }}>
      {!hideLayout && <Navbar />}
      <main id="main-content" style={{ flexGrow: 1, paddingTop: hideLayout ? 0 : 64 }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />
          <Route path="/contact" element={<Contact />} />

          {/* Resources - Public (anyone can browse) */}
          <Route path="/dashboard/resources" element={<ResourcesPage />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/dashboard/incidents" element={
            <ProtectedRoute>
              <Incidents />
            </ProtectedRoute>
          } />

          <Route path="/dashboard/bookings" element={
            <ProtectedRoute>
              <StudentBookingsPage />
            </ProtectedRoute>
          } />

          <Route path="/dashboard/bookings/new/:resourceId" element={
            <ProtectedRoute>
              <StudentBookingFormPage />
            </ProtectedRoute>
          } />

          <Route path="/dashboard/bookings/:bookingId/reschedule" element={
            <ProtectedRoute>
              <StudentBookingFormPage />
            </ProtectedRoute>
          } />

          <Route path="/admin/incidents" element={
            <ProtectedRoute requiredRole="ROLE_ADMIN">
              <AdminIncidentsPage />
            </ProtectedRoute>
          } />

          <Route path="/admin/bookings" element={
            <ProtectedRoute requiredRole="ROLE_ADMIN">
              <AdminBookingsPage />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute requiredRole="ROLE_ADMIN">
              <AdminOverview />
            </ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute requiredRole="ROLE_ADMIN">
              <UserManagement />
            </ProtectedRoute>
          } />

          <Route path="/admin/resources" element={
            <ProtectedRoute requiredRole="ROLE_ADMIN">
              <AdminResourcesPage />
            </ProtectedRoute>
          } />

          <Route path="/admin/profile" element={
            <ProtectedRoute requiredRole="ROLE_ADMIN">
              <AdminEditProfile />
            </ProtectedRoute>
          } />

          <Route path="/admin/add-admin" element={
            <ProtectedRoute requiredRole="ROLE_ADMIN">
              <AddAdmin />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      {!hideLayout && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}

export default App;
