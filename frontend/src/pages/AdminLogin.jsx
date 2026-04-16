import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import BackgroundSlideshow, { DEFAULT_SLIDES } from '../components/common/BackgroundSlideshow';
import { IconChevronRight, IconChevronLeft, IconShield } from '../components/common/Icons';

export default function AdminLogin() {
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8081/api/auth/login', { email, password });
      const { token, roles } = response.data;
      if (!roles || !roles.includes('ROLE_ADMIN')) {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }
      await loginWithToken(token);
      navigate('/admin/resources', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundSlideshow slides={DEFAULT_SLIDES} className="min-h-screen grid place-items-center px-4 py-14">
      <div className="w-full max-w-md">
        <div className="card-3d rounded-3xl border border-white/15 bg-black/35 p-7 shadow-[0_18px_70px_rgba(0,0,0,.35)] backdrop-blur sm:p-8">

          {/* Back */}
          <button onClick={() => navigate('/login')}
            className="mb-6 inline-flex items-center gap-1 text-xs font-extrabold tracking-[0.15em] text-white/60 uppercase hover:text-white transition">
            <IconChevronLeft size={14}/> Back to Login
          </button>

          {/* Header */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-extrabold tracking-[0.18em] text-amber-300 uppercase mb-4">
              <IconShield size={12}/> Admin Portal
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Administrator Access</h1>
            <p className="mt-2 text-sm text-white/65">Sign in with your admin credentials to manage the system</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-300/25 bg-red-300/10 px-4 py-3 text-sm font-bold text-red-200">
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div>
              <label className="block text-xs font-extrabold tracking-[0.18em] text-white/60 uppercase mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@smartcampus.com"
                required
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[var(--accent2)]/60"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-extrabold tracking-[0.18em] text-white/60 uppercase">
                  Password
                </label>
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="text-xs font-extrabold text-white/60 hover:text-white transition">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[var(--accent2)]/60"
              />
            </div>

            <button type="submit" disabled={loading}
              className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent2)] px-5 py-3 text-sm font-extrabold text-[#061018] shadow-[0_14px_40px_rgba(0,229,195,.18)] hover:opacity-95 disabled:opacity-60">
              {loading ? (
                <>
                  <div style={{ width:16, height:16, border:'2px solid rgba(0,0,0,0.2)', borderTop:'2px solid #061018', borderRadius:'50%', animation:'spin 0.6s linear infinite' }}/>
                  Signing in…
                </>
              ) : (
                <>Sign In as Admin <IconChevronRight size={16}/></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-white/40">
            Authorized administrators only. All actions are logged.
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </BackgroundSlideshow>
  );
}
