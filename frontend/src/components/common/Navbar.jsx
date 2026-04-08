import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useNotifications from '../../hooks/useNotifications';
import { IconBell, IconChevronDown, IconMenu, IconX } from './Icons';
import fallbackLogo from '../../logo.svg';

const LOGO_CANDIDATES = [
  'https://i.imgur.com/BgTMqyZ.png',
  'https://i.imgur.com/BgTMqyZ.jpg',
  'https://i.imgur.com/BgTMqyZ.jpeg',
  'https://i.imgur.com/BgTMqyZ.webp',
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    try {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  const [logoIdx, setLogoIdx] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = useMemo(() => {
    const links = [
      { to: '/', label: 'Home' },
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/contact', label: 'Contact' },
    ];
    if (user?.roles?.includes('ROLE_ADMIN')) links.splice(2, 0, { to: '/admin', label: 'Admin' });
    return links;
  }, [user?.roles]);

  useEffect(() => {
    setShowNotifs(false);
    setShowUserMenu(false);
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (showNotifs) fetchNotifications();
  }, [showNotifs, fetchNotifications]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      setShowNotifs(false);
      setShowUserMenu(false);
      setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'theme') setTheme(e.newValue === 'light' ? 'light' : 'dark');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const closeAll = () => {
    setShowNotifs(false);
    setShowUserMenu(false);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeAll();
    navigate('/login');
  };

  const formatTime = (value) => {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return '';
    }
  };

  const isLight = theme === 'light';

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-black/80 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <nav
        className={[
          'fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl',
          isLight ? 'border-slate-900/10 bg-white/75' : 'border-white/10 bg-[#0a0e16]/70',
        ].join(' ')}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className={['flex items-center gap-2.5 no-underline', isLight ? 'text-slate-900' : 'text-white'].join(' ')}>
            <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-[#4f6fff] to-[#00e5c3] shadow-[0_0_30px_rgba(79,111,255,.25)]">
              <img
                src={LOGO_CANDIDATES[logoIdx] || fallbackLogo}
                onError={() => setLogoIdx((i) => (i < LOGO_CANDIDATES.length ? i + 1 : i))}
                alt="SmartCampus"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="leading-tight">
              <div className={['text-sm font-extrabold tracking-tight', isLight ? 'text-slate-900' : 'text-white'].join(' ')}>
                Smart<span className="text-[#06b6d4]">Campus</span>
              </div>
              <div className={['text-[11px] font-medium', isLight ? 'text-slate-600' : 'text-white/55'].join(' ')}>
                Operations Hub
              </div>
            </div>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  [
                    'rounded-lg px-3 py-2 text-sm font-semibold transition',
                    isLight
                      ? isActive
                        ? 'bg-slate-900/5 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-900/5 hover:text-slate-900'
                      : isActive
                        ? 'bg-white/5 text-white'
                        : 'text-white/60 hover:bg-white/5 hover:text-white',
                  ].join(' ')
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={[
                'inline-flex items-center justify-center rounded-lg border p-2 md:hidden',
                isLight ? 'border-slate-900/10 bg-slate-900/5 text-slate-700 hover:text-slate-900' : 'border-white/10 bg-white/5 text-white/70 hover:text-white',
              ].join(' ')}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => {
                setMobileOpen((v) => !v);
                setShowNotifs(false);
                setShowUserMenu(false);
              }}
            >
              {mobileOpen ? <IconX size={20} /> : <IconMenu size={20} />}
            </button>

            <button
              type="button"
              className={[
                'hidden items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold sm:inline-flex',
                isLight
                  ? 'border-slate-900/10 bg-slate-900/5 text-slate-700 hover:text-slate-900'
                  : 'border-white/10 bg-white/5 text-white/70 hover:text-white',
              ].join(' ')}
              aria-pressed={theme === 'light'}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
            >
              <span className={['text-[11px] font-extrabold tracking-wider', isLight ? 'text-slate-600' : 'text-white/60'].join(' ')}>
                Theme
              </span>
              <span
                className={[
                  'relative h-5 w-10 rounded-full border transition',
                  isLight ? 'border-slate-900/10 bg-slate-900/10' : 'border-white/10 bg-black/30',
                  theme === 'light' ? 'ring-1 ring-[#06b6d4]/30' : '',
                ].join(' ')}
              >
                <span
                  className={[
                    'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white/70 transition',
                    theme === 'light' ? 'right-0.5 bg-[#06b6d4]' : 'left-0.5 bg-white/70',
                  ].join(' ')}
                />
              </span>
            </button>

            {user ? (
              <>
                <div className="relative">
                  <button
                    type="button"
                    className={[
                      'relative inline-flex items-center justify-center rounded-lg border p-2',
                      isLight ? 'border-slate-900/10 bg-slate-900/5 text-slate-700 hover:text-slate-900' : 'border-white/10 bg-white/5 text-white/70 hover:text-white',
                    ].join(' ')}
                    aria-label="Notifications"
                    onClick={() => {
                      setShowNotifs((v) => !v);
                      setShowUserMenu(false);
                      setMobileOpen(false);
                    }}
                  >
                    <IconBell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-extrabold text-white shadow">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifs && (
                    <div
                      className={[
                        'absolute right-0 mt-3 w-[360px] max-w-[92vw] overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,.55)] backdrop-blur-xl',
                        isLight ? 'border-slate-900/10 bg-white/90' : 'border-white/10 bg-[#0d1120]/95',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                        <div className={['text-sm font-extrabold', isLight ? 'text-slate-900' : 'text-white'].join(' ')}>
                          Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
                        </div>
                        <button
                          type="button"
                          className={[
                            'text-xs font-bold disabled:opacity-40',
                            isLight ? 'text-slate-700 hover:text-slate-900' : 'text-[#00e5c3] hover:text-white',
                          ].join(' ')}
                          onClick={markAllAsRead}
                          disabled={unreadCount === 0}
                        >
                          Mark all read
                        </button>
                      </div>

                      <div className="max-h-[420px] overflow-y-auto">
                        {loading ? (
                          <div className={['px-4 py-8 text-center text-sm', isLight ? 'text-slate-600' : 'text-white/60'].join(' ')}>
                            Loading…
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className={['px-4 py-8 text-center text-sm', isLight ? 'text-slate-600' : 'text-white/60'].join(' ')}>
                            No notifications
                          </div>
                        ) : (
                          notifications.slice(0, 12).map((n) => (
                            <div
                              key={n.id}
                              className={[
                                'group flex gap-3 px-4 py-3',
                                isLight ? 'border-b border-slate-900/5' : 'border-b border-white/5',
                                n.read ? 'bg-transparent' : isLight ? 'bg-slate-900/[0.03]' : 'bg-white/[0.04]',
                              ].join(' ')}
                            >
                              <div className="min-w-0 flex-1">
                                <div className={['text-sm', isLight ? 'text-slate-900' : 'text-white/90'].join(' ')}>
                                  {n.message}
                                </div>
                                <div className={['mt-1 text-[11px]', isLight ? 'text-slate-600' : 'text-white/45'].join(' ')}>
                                  {formatTime(n.createdAt)}
                                </div>
                              </div>
                              <div className="flex items-start gap-1">
                                {!n.read && (
                                  <button
                                    type="button"
                                    className={[
                                      'rounded-lg border px-2 py-1 text-[11px] font-bold',
                                      isLight ? 'border-slate-900/10 bg-slate-900/5 text-slate-700 hover:text-slate-900' : 'border-white/10 bg-white/5 text-white/70 hover:text-white',
                                    ].join(' ')}
                                    aria-label="Mark as read"
                                    onClick={() => markAsRead(n.id)}
                                  >
                                    Read
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className={[
                                    'rounded-lg border px-2 py-1 text-[11px] font-bold',
                                    isLight ? 'border-slate-900/10 bg-slate-900/5 text-slate-700 hover:text-slate-900' : 'border-white/10 bg-white/5 text-white/70 hover:text-white',
                                  ].join(' ')}
                                  aria-label="Delete notification"
                                  onClick={() => deleteNotification(n.id)}
                                >
                                  Del
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="flex items-center justify-between px-4 py-3">
                        <span className={['text-[11px]', isLight ? 'text-slate-600' : 'text-white/45'].join(' ')}>
                          Showing latest
                        </span>
                        <button
                          type="button"
                          className={['text-xs font-bold', isLight ? 'text-slate-700 hover:text-slate-900' : 'text-white/70 hover:text-white'].join(' ')}
                          onClick={() => setShowNotifs(false)}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    className={[
                      'flex items-center gap-2 rounded-lg border px-2 py-1.5',
                      isLight ? 'border-slate-900/10 bg-slate-900/5 text-slate-700 hover:text-slate-900' : 'border-white/10 bg-white/5 text-white/80 hover:text-white',
                    ].join(' ')}
                    aria-label="User menu"
                    onClick={() => {
                      setShowUserMenu((v) => !v);
                      setShowNotifs(false);
                      setMobileOpen(false);
                    }}
                  >
                    <img
                      src={
                        user.picture ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4f6fff&color=fff`
                      }
                      alt={user.name}
                      className="h-8 w-8 rounded-full border border-white/10"
                    />
                    <span className="hidden text-sm font-bold sm:inline">{user.name?.split(' ')[0]}</span>
                    <IconChevronDown size={18} className={isLight ? 'text-slate-500' : 'text-white/50'} />
                  </button>

                  {showUserMenu && (
                    <div
                      className={[
                        'absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,.55)] backdrop-blur-xl',
                        isLight ? 'border-slate-900/10 bg-white/90' : 'border-white/10 bg-[#0d1120]/95',
                      ].join(' ')}
                    >
                      <div className={['border-b px-4 py-3', isLight ? 'border-slate-900/10' : 'border-white/10'].join(' ')}>
                        <div className={['text-sm font-extrabold', isLight ? 'text-slate-900' : 'text-white'].join(' ')}>
                          {user.name}
                        </div>
                        <div className={['mt-0.5 break-all text-xs', isLight ? 'text-slate-600' : 'text-white/55'].join(' ')}>
                          {user.email}
                        </div>
                      </div>
                      <div className="p-2">
                        <Link
                          to="/dashboard"
                          className={[
                            'block rounded-xl px-3 py-2 text-sm font-semibold',
                            isLight ? 'text-slate-700 hover:bg-slate-900/5 hover:text-slate-900' : 'text-white/70 hover:bg-white/5 hover:text-white',
                          ].join(' ')}
                          onClick={() => setShowUserMenu(false)}
                        >
                          Go to dashboard
                        </Link>
                        {user.roles?.includes('ROLE_ADMIN') && (
                          <Link
                            to="/admin"
                            className={[
                              'block rounded-xl px-3 py-2 text-sm font-semibold',
                              isLight ? 'text-amber-700 hover:bg-slate-900/5' : 'text-amber-200 hover:bg-white/5',
                            ].join(' ')}
                            onClick={() => setShowUserMenu(false)}
                          >
                            Admin panel
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={handleLogout}
                          className={[
                            'mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold',
                            isLight ? 'text-red-600 hover:bg-slate-900/5' : 'text-red-300 hover:bg-white/5',
                          ].join(' ')}
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="hidden rounded-lg bg-gradient-to-br from-[#4f6fff] to-[#00e5c3] px-4 py-2 text-sm font-extrabold text-[#060812] shadow-[0_0_30px_rgba(79,111,255,.22)] hover:opacity-95 sm:inline-flex"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>

        {mobileOpen && (
          <div
            className={[
              'border-t backdrop-blur-xl md:hidden',
              isLight ? 'border-slate-900/10 bg-white/80' : 'border-white/10 bg-[#0a0e16]/85',
            ].join(' ')}
          >
            <div className="mx-auto max-w-7xl space-y-2 px-4 py-3 sm:px-6">
              <button
                type="button"
                className={[
                  'flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm font-semibold',
                  isLight ? 'border-slate-900/10 bg-slate-900/5 text-slate-800' : 'border-white/10 bg-white/5 text-white/80',
                ].join(' ')}
                onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
              >
                <span>Theme</span>
                <span className={isLight ? 'text-slate-600' : 'text-white/60'}>{theme === 'light' ? 'Light' : 'Dark'}</span>
              </button>

              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    [
                      'block rounded-xl px-3 py-2 text-sm font-semibold',
                      isLight
                        ? isActive
                          ? 'bg-slate-900/5 text-slate-900'
                          : 'text-slate-700 hover:bg-slate-900/5 hover:text-slate-900'
                        : isActive
                          ? 'bg-white/5 text-white'
                          : 'text-white/70 hover:bg-white/5 hover:text-white',
                    ].join(' ')
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              {!user && (
                <Link
                  to="/login"
                  className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#4f6fff] to-[#00e5c3] px-4 py-2 text-sm font-extrabold text-[#060812]"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {(showNotifs || showUserMenu || mobileOpen) && (
        <div onClick={closeAll} className="fixed inset-0 z-40 bg-transparent" />
      )}
    </>
  );
};

export default Navbar;
