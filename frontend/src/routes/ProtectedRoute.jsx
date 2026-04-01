import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading, isAdmin, isStaff } = useAuth();
  const location = useLocation();
  const token = localStorage.getItem('token');

  // 1. මුලින්ම Loading State එක පරීක්ෂා කරන්න
  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.loaderContent}>
          <div style={styles.spinner} />
          <p style={styles.loaderText}>Checking authentication...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // 2. Token එකක් ඇත්තෙම නැත්නම් Login එකට යවන්න
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Token එක තියෙනවා, හැබැයි තවම Profile එක ඇවිත් නැත්නම් (Loading Finish වෙලාත්)
  // මේක වෙන්නේ fetchProfile එක fail වුණොත් හෝ තවම sync වෙනවා නම්
  if (!user) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.loaderContent}>
          <div style={styles.spinner} />
          <p style={styles.loaderText}>Loading your profile...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // 4. Role එක පරීක්ෂා කිරීම (Required Role එකක් තියෙනවා නම් පමණක්)
  // user.roles?.includes(...) පාවිච්චි කරලා crash වීම වළක්වමු
  if (requiredRole && !user.roles?.includes(requiredRole)) {
    console.warn(`Unauthorized access! Required: ${requiredRole}, User has:`, user.roles);
    
    // වැරදි role එකකින් ආවොත් අදාළ Dashboard එකට redirect කරන්න
    // මෙතන isAdmin() සහ isStaff() call කරලා බලනවා (Functions නිසා () අත්‍යවශ්‍යයි)
    if (isAdmin()) return <Navigate to="/admin" replace />;
    if (isStaff()) return <Navigate to="/dashboard" replace />;
    
    return <Navigate to="/dashboard" replace />;
  }

  // ඔක්කොම හරි නම් අදාළ Page එක පෙන්වන්න
  return children;
};

const styles = {
  loaderContainer: {
    display: 'flex', 
    alignItems: 'center',
    justifyContent: 'center', 
    height: '100vh', 
    background: '#060812', // Background එක dark color එකට ගැලපෙන්න හැදුවා
  },
  loaderContent: { textAlign: 'center' },
  spinner: {
    width: 40, 
    height: 40,
    border: '3px solid #1e2a3a',
    borderTop: '3px solid #4f8ef7',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto 12px',
  },
  loaderText: { 
    color: '#9ca3af', 
    fontSize: 14, 
    fontFamily: "'Inter', sans-serif" 
  }
};

export default ProtectedRoute;