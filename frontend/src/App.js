import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import OAuthCallback from './pages/OAuthCallback';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import UserManagement from './pages/admin/UserManagement';
import Contact from './pages/Contact';

import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// ✅ Navbar සහ Footer වෙනම component එකක් — location access කරන්න
function AppLayout() {
  const location = useLocation();
  
  // මේ pages වලදී Navbar/Footer පෙන්වන්න එපා
  const hideLayout = ['/login', '/oauth-callback'].includes(location.pathname);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: "var(--bg)", color: "var(--text)" }}>
      {!hideLayout && <Navbar />}
      <main id="main-content" style={{ flexGrow: 1, paddingTop: hideLayout ? 0 : 64 }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />
          <Route path="/contact" element={<Contact />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute requiredRole="ROLE_ADMIN">
              <AdminPanel />
            </ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute requiredRole="ROLE_ADMIN">
              <UserManagement />
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
