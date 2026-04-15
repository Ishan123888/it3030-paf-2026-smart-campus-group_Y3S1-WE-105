import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  IconLayoutDashboard, IconResource, IconUsers,
  IconAlertTriangle, IconLogOut, IconMenu, IconX, IconChevronRight,
  IconUserEdit, IconUserPlus, IconCalendar,
} from '../common/Icons';

const NAV_ITEMS = [
  { to: '/admin',           icon: IconLayoutDashboard, label: 'Overview',       exact: true },
  { to: '/admin/resources', icon: IconResource,        label: 'Resources'       },
  { to: '/admin/bookings',  icon: IconCalendar,        label: 'Bookings'        },
  { to: '/admin/users',     icon: IconUsers,           label: 'User Management' },
  { to: '/admin/incidents', icon: IconAlertTriangle,   label: 'Incidents'       },
  { to: '/admin/add-admin', icon: IconUserPlus,        label: 'Add Admin'       },
  { to: '/admin/profile',   icon: IconUserEdit,        label: 'Edit Profile'    },
];

const MOBILE_BP = 768;

export default function AdminLayout({ children, title = 'Admin Dashboard' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BP);
  // Desktop: collapsed = icon-only. Mobile: collapsed = hidden drawer
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < MOBILE_BP;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const avatarSrc = user?.picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}&background=4f6fff&color=fff`;

  // On mobile sidebar is a drawer; on desktop it's a fixed sidebar
  const sidebarVisible = isMobile ? mobileOpen : true;
  const sidebarWidth   = isMobile ? 260 : (collapsed ? 68 : 256);
  const mainMargin     = isMobile ? 0 : (collapsed ? 68 : 256);

  const closeMobile = () => setMobileOpen(false);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ ...s.logoRow, justifyContent: collapsed && !isMobile ? 'center' : 'space-between' }}>
        <div style={s.logoInner}>
          <div style={s.logoCircle}>
            <img src="https://i.imgur.com/BgTMqyZ.png" onError={e => e.target.style.display='none'} alt="logo" style={s.logoImg} />
          </div>
          {(!collapsed || isMobile) && (
            <div>
              <div style={s.logoTitle}>Smart<span style={s.logoAccent}>Campus</span></div>
              <div style={s.logoSub}>Admin Portal</div>
            </div>
          )}
        </div>
        {/* Close button */}
        {isMobile ? (
          <button onClick={closeMobile} style={s.collapseBtn}><IconX size={16} /></button>
        ) : (!collapsed && (
          <button onClick={() => setCollapsed(true)} style={s.collapseBtn} title="Collapse"><IconX size={16} /></button>
        ))}
      </div>

      <div style={s.divider} />

      {/* Profile */}
      <div style={{ ...s.profileRow, justifyContent: collapsed && !isMobile ? 'center' : 'flex-start' }}>
        <img src={avatarSrc} alt="profile" style={s.profileAvatar} />
        {(!collapsed || isMobile) && (
          <div style={s.profileInfo}>
            <div style={s.profileName}>{user?.name || 'Administrator'}</div>
            <div style={s.profileRole}><span style={s.onlineDot} />Admin</div>
          </div>
        )}
      </div>

      <div style={s.divider} />

      {/* Nav */}
      <nav style={s.nav}>
        {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={isMobile ? closeMobile : undefined}
            style={({ isActive }) => ({
              ...s.navItem,
              background: isActive ? 'rgba(79,111,255,0.12)' : 'transparent',
              borderLeft: isActive ? '3px solid #4f6fff' : '3px solid transparent',
              color: isActive ? '#e2e8f0' : '#64748b',
              justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
              paddingLeft: collapsed && !isMobile ? 0 : 16,
            })}
            title={collapsed && !isMobile ? label : undefined}
          >
            <Icon size={18} />
            {(!collapsed || isMobile) && <span style={s.navLabel}>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div>
        <div style={s.divider} />
        <button
          onClick={() => { if (isMobile) closeMobile(); setShowLogoutConfirm(true); }}
          style={{
            ...s.navItem,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#ef4444', borderLeft: '3px solid transparent',
            justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
            paddingLeft: collapsed && !isMobile ? 0 : 16,
            width: '100%', marginBottom: 8,
          }}
        >
          <IconLogOut size={18} />
          {(!collapsed || isMobile) && <span style={s.navLabel}>Sign Out</span>}
        </button>
      </div>
    </>
  );

  return (
    <div style={s.root}>
      {/* ── Mobile Overlay ───────────────────────────────────── */}
      {isMobile && mobileOpen && (
        <div onClick={closeMobile} style={s.mobileOverlay} />
      )}

      {/* ── Sidebar ─────────────────────────────────────────── */}
      {sidebarVisible && (
        <aside style={{
          ...s.sidebar,
          width: sidebarWidth,
          transform: isMobile && !mobileOpen ? 'translateX(-100%)' : 'translateX(0)',
        }}>
          <SidebarContent />
        </aside>
      )}

      {/* ── Main ─────────────────────────────────────────────── */}
      <div style={{ ...s.main, marginLeft: mainMargin }}>
        {/* Top Nav */}
        <header style={s.topNav}>
          <div style={s.topLeft}>
            <button
              onClick={() => isMobile ? setMobileOpen(v => !v) : setCollapsed(v => !v)}
              style={s.menuBtn}
            >
              <IconMenu size={18} />
            </button>
            <h1 style={s.pageTitle}>{title}</h1>
          </div>

          <div style={s.topRight}>
            {/* Admin badge — hide text on very small screens */}
            <div style={{ ...s.adminBadge, display: 'flex' }}>
              <span style={s.badgeDot} />
              <span style={{ display: window.innerWidth < 480 ? 'none' : 'inline' }}>Administrator</span>
            </div>

            {/* User dropdown */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowUserMenu(v => !v)} style={s.userBtn}>
                <img src={avatarSrc} alt="profile" style={s.topAvatar} />
                {window.innerWidth >= 480 && (
                  <span style={s.topName}>{user?.name?.split(' ')[0] || 'Admin'}</span>
                )}
                <IconChevronRight size={14} style={{ transform: 'rotate(90deg)', color: '#94a3b8' }} />
              </button>

              {showUserMenu && (
                <div style={s.dropdown}>
                  <div style={s.dropdownHead}>
                    <img src={avatarSrc} alt="profile" style={s.dropdownAvatar} />
                    <div style={{ minWidth: 0 }}>
                      <div style={s.dropdownName}>{user?.name}</div>
                      <div style={{ ...s.dropdownEmail, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                    </div>
                  </div>
                  <div style={s.dropdownDivider} />
                  <button onClick={() => { setShowUserMenu(false); setShowLogoutConfirm(true); }} style={s.dropdownLogout}>
                    <IconLogOut size={15} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={s.content}>{children}</main>
      </div>

      {showUserMenu && <div onClick={() => setShowUserMenu(false)} style={s.overlay} />}

      {/* ── Sign Out Confirmation ─────────────────────────── */}
      {showLogoutConfirm && (
        <div style={s.confirmBackdrop}>
          <div style={s.confirmCard}>
            <div style={s.confirmIconWrap}>
              <IconLogOut size={28} style={{ color: '#ef4444' }} />
            </div>
            <h3 style={s.confirmTitle}>Sign Out?</h3>
            <p style={s.confirmText}>
              You'll be signed out of the admin portal. Any unsaved changes will be lost.
            </p>
            <div style={s.confirmActions}>
              <button onClick={() => setShowLogoutConfirm(false)} style={s.confirmCancel}>Cancel</button>
              <button onClick={handleLogout} style={s.confirmLogout}>
                <IconLogOut size={15} /> Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  root: {
    display: 'flex', minHeight: '100vh', background: '#f1f5f9',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  mobileOverlay: {
    position: 'fixed', inset: 0, zIndex: 99,
    background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(2px)',
  },
  sidebar: {
    position: 'fixed', top: 0, left: 0, height: '100vh',
    background: '#0f172a', display: 'flex', flexDirection: 'column',
    transition: 'width 0.22s ease, transform 0.25s ease',
    zIndex: 100, overflow: 'hidden',
    boxShadow: '4px 0 20px rgba(0,0,0,0.18)',
  },
  logoRow: {
    display: 'flex', alignItems: 'center', padding: '20px 14px 16px',
    minHeight: 68, gap: 8,
  },
  logoInner: { display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  logoCircle: {
    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
    background: 'linear-gradient(135deg,#4f6fff,#00e5c3)',
    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoImg: { width: '100%', height: '100%', objectFit: 'cover' },
  logoTitle: { fontSize: 15, fontWeight: 800, color: '#f1f5f9', whiteSpace: 'nowrap', letterSpacing: '-0.3px' },
  logoAccent: { color: '#00e5c3' },
  logoSub: { fontSize: 10, color: '#475569', fontWeight: 500, whiteSpace: 'nowrap', marginTop: 1 },
  collapseBtn: {
    background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 6,
    width: 28, height: 28, cursor: 'pointer', color: '#64748b',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  divider: { height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 14px' },
  profileRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 14px' },
  profileAvatar: {
    width: 36, height: 36, borderRadius: '50%', objectFit: 'cover',
    border: '2px solid rgba(79,111,255,0.4)', flexShrink: 0,
  },
  profileInfo: { overflow: 'hidden', flex: 1 },
  profileName: { fontSize: 13, fontWeight: 700, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  profileRole: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b', marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: '50%', background: '#00e5c3', display: 'inline-block', flexShrink: 0 },
  nav: { flex: 1, padding: '8px 0', overflowY: 'auto' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '11px 0', paddingRight: 16,
    textDecoration: 'none', fontSize: 13, fontWeight: 600,
    transition: 'all 0.15s', cursor: 'pointer', whiteSpace: 'nowrap',
    borderRadius: '0 8px 8px 0', margin: '1px 8px 1px 0',
  },
  navLabel: { fontSize: 13, fontWeight: 600 },
  topNav: {
    position: 'sticky', top: 0, zIndex: 50, height: 60,
    background: '#ffffff', borderBottom: '1px solid #e2e8f0',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  topLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  menuBtn: {
    background: 'none', border: '1px solid #e2e8f0', borderRadius: 8,
    width: 34, height: 34, cursor: 'pointer', color: '#475569',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  pageTitle: { fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '40vw' },
  topRight: { display: 'flex', alignItems: 'center', gap: 8 },
  adminBadge: {
    alignItems: 'center', gap: 6,
    background: '#fef3c7', border: '1px solid #fbbf24',
    borderRadius: 8, padding: '5px 10px',
    fontSize: 12, fontWeight: 700, color: '#92400e',
  },
  badgeDot: { width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block', flexShrink: 0 },
  userBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'none', border: '1px solid #e2e8f0', borderRadius: 10,
    padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit',
  },
  topAvatar: { width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' },
  topName: { fontSize: 13, fontWeight: 600, color: '#0f172a' },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    background: '#ffffff', border: '1px solid #e2e8f0',
    borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    minWidth: 220, maxWidth: '90vw', zIndex: 200, overflow: 'hidden',
  },
  dropdownHead: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' },
  dropdownAvatar: { width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  dropdownName: { fontSize: 14, fontWeight: 700, color: '#0f172a' },
  dropdownEmail: { fontSize: 12, color: '#64748b', marginTop: 2 },
  dropdownDivider: { height: 1, background: '#f1f5f9' },
  dropdownLogout: {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%', padding: '12px 16px',
    background: 'none', border: 'none', textAlign: 'left',
    fontSize: 14, fontWeight: 600, color: '#ef4444',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  main: { flex: 1, transition: 'margin-left 0.22s ease', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  content: { flex: 1, padding: '20px 16px', overflowY: 'auto' },
  overlay: { position: 'fixed', inset: 0, zIndex: 99 },
  confirmBackdrop: {
    position: 'fixed', inset: 0, zIndex: 300,
    background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  confirmCard: {
    background: '#ffffff', borderRadius: 20, padding: '32px 28px',
    maxWidth: 380, width: '100%', textAlign: 'center',
    boxShadow: '0 24px 60px rgba(0,0,0,0.18)', border: '1px solid #e2e8f0',
  },
  confirmIconWrap: {
    width: 64, height: 64, borderRadius: '50%',
    background: '#fef2f2', border: '1px solid #fecaca',
    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
  },
  confirmTitle: { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 10px', letterSpacing: '-0.3px' },
  confirmText: { fontSize: 14, color: '#64748b', margin: '0 0 28px', lineHeight: 1.6 },
  confirmActions: { display: 'flex', gap: 10, justifyContent: 'center' },
  confirmCancel: {
    flex: 1, padding: '11px 20px', borderRadius: 10,
    background: '#f1f5f9', border: '1px solid #e2e8f0',
    color: '#475569', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  confirmLogout: {
    flex: 1, padding: '11px 20px', borderRadius: 10,
    background: '#ef4444', border: 'none', color: '#ffffff',
    fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
  },
};
