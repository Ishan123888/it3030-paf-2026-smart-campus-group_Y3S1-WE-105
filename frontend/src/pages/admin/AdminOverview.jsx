import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import { getAllUsers, getResources, getAllBookings, getIncidents } from '../../api/api';
import {
  IconUsers, IconResource, IconAlertTriangle,
  IconActivity, IconUserCheck, IconPackage,
  IconChevronRight, IconCalendar,
} from '../../components/common/Icons';

export default function AdminOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0, admins: 0,
    resources: 0, active: 0, oos: 0,
    bookings: 0, pendingBookings: 0,
    incidents: 0, openIncidents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentIncidents, setRecentIncidents] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, resourcesRes, bookingsRes, incidentsRes] = await Promise.allSettled([
          getAllUsers(),
          getResources({}),
          getAllBookings({}),
          getIncidents(),
        ]);

        const users     = usersRes.status     === 'fulfilled' ? (usersRes.value.data     || []) : [];
        const resources = resourcesRes.status === 'fulfilled' ? (resourcesRes.value.data || []) : [];
        const bookings  = bookingsRes.status  === 'fulfilled' ? (bookingsRes.value.data  || []) : [];
        const incidents = incidentsRes.status === 'fulfilled' ? (incidentsRes.value.data || []) : [];

        setStats({
          users:           users.length,
          admins:          users.filter(u => u.roles?.includes('ROLE_ADMIN')).length,
          resources:       resources.length,
          active:          resources.filter(r => r.status === 'ACTIVE').length,
          oos:             resources.filter(r => r.status === 'OUT_OF_SERVICE').length,
          bookings:        bookings.length,
          pendingBookings: bookings.filter(b => b.status === 'PENDING').length,
          incidents:       incidents.length,
          openIncidents:   incidents.filter(i => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length,
        });

        // Recent 5 bookings sorted by createdAt desc
        setRecentBookings(
          [...bookings]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
        );

        // Recent 5 open incidents
        setRecentIncidents(
          [...incidents]
            .filter(i => i.status === 'OPEN' || i.status === 'IN_PROGRESS')
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 5)
        );
      } catch (err) {
        console.error('Failed to load overview stats', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards = [
    { label: 'Total Users',        value: stats.users,           icon: IconUsers,     color: '#4f6fff', bg: '#eff6ff', border: '#bfdbfe', path: '/admin/users' },
    { label: 'Administrators',     value: stats.admins,          icon: IconUserCheck, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', path: '/admin/users' },
    { label: 'Total Resources',    value: stats.resources,       icon: IconPackage,   color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', path: '/admin/resources' },
    { label: 'Active Resources',   value: stats.active,          icon: IconActivity,  color: '#059669', bg: '#f0fdf4', border: '#bbf7d0', path: '/admin/resources' },
    { label: 'Total Bookings',     value: stats.bookings,        icon: IconCalendar,  color: '#d97706', bg: '#fffbeb', border: '#fde68a', path: '/admin/bookings' },
    { label: 'Pending Bookings',   value: stats.pendingBookings, icon: IconCalendar,  color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', path: '/admin/bookings' },
    { label: 'Total Incidents',    value: stats.incidents,       icon: IconAlertTriangle, color: '#dc2626', bg: '#fef2f2', border: '#fecaca', path: '/admin/incidents' },
    { label: 'Open Incidents',     value: stats.openIncidents,   icon: IconAlertTriangle, color: '#b91c1c', bg: '#fef2f2', border: '#fca5a5', path: '/admin/incidents' },
  ];

  const quickActions = [
    { label: 'Add Resource',    desc: 'Create a new campus resource',   icon: IconResource,      color: '#4f6fff', path: '/admin/resources' },
    { label: 'Manage Users',    desc: 'Update roles and permissions',    icon: IconUsers,         color: '#7c3aed', path: '/admin/users' },
    { label: 'View Incidents',  desc: 'Review and resolve incidents',    icon: IconAlertTriangle, color: '#dc2626', path: '/admin/incidents' },
    { label: 'Manage Bookings', desc: 'Approve or reject booking requests', icon: IconCalendar,  color: '#d97706', path: '/admin/bookings' },
  ];

  return (
    <AdminLayout title="Overview">
      {/* Welcome Banner */}
      <div style={s.banner}>
        <div style={s.bannerContent}>
          <div style={s.bannerText}>
            <h2 style={s.bannerTitle}>Welcome back, {user?.name?.split(' ')[0] || 'Admin'} 👋</h2>
            <p style={s.bannerSub}>Here's a live snapshot of your SmartCampus system.</p>
          </div>
          <div style={s.bannerIcon}>
            <IconLayoutDashboard size={48} style={{ color: 'rgba(255,255,255,0.3)' }} />
          </div>
        </div>
      </div>

      {/* Stat Cards — 4 per row on desktop */}
      <div style={s.statsGrid}>
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <button key={card.label} onClick={() => navigate(card.path)}
              style={{ ...s.statCard, background: card.bg, border: `1px solid ${card.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ ...s.statValue, color: card.color }}>
                    {loading ? (
                      <span style={{ display: 'inline-block', width: 32, height: 32, borderRadius: 6, background: `${card.color}22`, animation: 'pulse 1.2s ease-in-out infinite' }} />
                    ) : card.value}
                  </div>
                  <div style={s.statLabel}>{card.label}</div>
                </div>
                <div style={{ ...s.statIconBox, background: `${card.color}18`, color: card.color }}>
                  <Icon size={20} />
                </div>
              </div>
              <div style={{ ...s.statFooter, color: card.color }}>
                View details <IconChevronRight size={13} />
              </div>
            </button>
          );
        })}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}`}</style>

      {/* Quick Actions */}
      <div style={s.sectionHeader}>
        <h3 style={s.sectionTitle}>Quick Actions</h3>
        <p style={s.sectionSub}>Jump to common admin tasks</p>
      </div>

      <div style={s.actionsGrid}>
        {quickActions.map(action => {
          const Icon = action.icon;
          return (
            <button key={action.label} onClick={() => navigate(action.path)} style={s.actionCard}>
              <div style={{ ...s.actionIconBox, background: `${action.color}12`, color: action.color }}>
                <Icon size={22} />
              </div>
              <div style={s.actionText}>
                <div style={s.actionLabel}>{action.label}</div>
                <div style={s.actionDesc}>{action.desc}</div>
              </div>
              <IconChevronRight size={16} style={{ color: '#cbd5e1', flexShrink: 0 }} />
            </button>
          );
        })}
      </div>

      {/* Two-column: Recent Bookings + Recent Open Incidents */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16, marginBottom: 24 }}>

        {/* Recent Bookings */}
        <div style={s.tableCard}>
          <div style={s.tableCardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconCalendar size={16} style={{ color: '#d97706' }} />
              <span style={s.sectionTitle}>Recent Bookings</span>
            </div>
            <button onClick={() => navigate('/admin/bookings')} style={s.viewAllBtn}>View all</button>
          </div>
          {loading ? (
            <div style={s.tableEmpty}>Loading…</div>
          ) : recentBookings.length === 0 ? (
            <div style={s.tableEmpty}>No bookings yet.</div>
          ) : (
            recentBookings.map(b => (
              <div key={b.id} style={s.tableRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.rowPrimary}>{b.resourceName}</div>
                  <div style={s.rowSub}>{b.userName} · {b.bookingDate}</div>
                </div>
                <StatusPill status={b.status} />
              </div>
            ))
          )}
        </div>

        {/* Open Incidents */}
        <div style={s.tableCard}>
          <div style={s.tableCardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconAlertTriangle size={16} style={{ color: '#dc2626' }} />
              <span style={s.sectionTitle}>Open Incidents</span>
            </div>
            <button onClick={() => navigate('/admin/incidents')} style={s.viewAllBtn}>View all</button>
          </div>
          {loading ? (
            <div style={s.tableEmpty}>Loading…</div>
          ) : recentIncidents.length === 0 ? (
            <div style={s.tableEmpty}>No open incidents 🎉</div>
          ) : (
            recentIncidents.map(inc => (
              <div key={inc.id} style={s.tableRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.rowPrimary}>{inc.ticketNumber} · {inc.category}</div>
                  <div style={s.rowSub}>{inc.createdByName} · {inc.location}</div>
                </div>
                <PriorityPill priority={inc.priority} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* System Status */}
      <div style={s.sectionHeader}>
        <h3 style={s.sectionTitle}>System Status</h3>
      </div>
      <div style={s.statusCard}>
        <div style={s.statusRow}>
          <StatusItem label="Backend API"              dot="#059669" badge="Online"    badgeBg="#f0fdf4" badgeColor="#059669" badgeBorder="#bbf7d0" />
          <StatusItem label="MongoDB Atlas"            dot="#059669" badge="Connected" badgeBg="#f0fdf4" badgeColor="#059669" badgeBorder="#bbf7d0" />
          <StatusItem
            label="Resources Out of Service"
            dot={stats.oos > 0 ? '#f59e0b' : '#059669'}
            badge={loading ? '—' : String(stats.oos)}
            badgeBg={stats.oos > 0 ? '#fffbeb' : '#f0fdf4'}
            badgeColor={stats.oos > 0 ? '#d97706' : '#059669'}
            badgeBorder={stats.oos > 0 ? '#fde68a' : '#bbf7d0'}
          />
          <StatusItem
            label="Pending Booking Requests"
            dot={stats.pendingBookings > 0 ? '#f59e0b' : '#059669'}
            badge={loading ? '—' : String(stats.pendingBookings)}
            badgeBg={stats.pendingBookings > 0 ? '#fffbeb' : '#f0fdf4'}
            badgeColor={stats.pendingBookings > 0 ? '#d97706' : '#059669'}
            badgeBorder={stats.pendingBookings > 0 ? '#fde68a' : '#bbf7d0'}
          />
        </div>
      </div>
    </AdminLayout>
  );
}

/* ── Small helpers ─────────────────────────────────────────────────────────── */

function StatusItem({ label, dot, badge, badgeBg, badgeColor, badgeBorder }) {
  return (
    <div style={s.statusItem}>
      <span style={{ ...s.statusDot, background: dot }} />
      <span style={s.statusLabel}>{label}</span>
      <span style={{ ...s.statusBadge, background: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}` }}>{badge}</span>
    </div>
  );
}

const STATUS_PILL_MAP = {
  PENDING:   { bg: '#fef3c7', color: '#92400e' },
  APPROVED:  { bg: '#dcfce7', color: '#166534' },
  REJECTED:  { bg: '#fee2e2', color: '#991b1b' },
  CANCELLED: { bg: '#e2e8f0', color: '#334155' },
};

function StatusPill({ status }) {
  const c = STATUS_PILL_MAP[status] || STATUS_PILL_MAP.CANCELLED;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: c.bg, color: c.color, flexShrink: 0, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
}

const PRIORITY_PILL_MAP = {
  LOW:      { bg: '#f0fdf4', color: '#059669' },
  MEDIUM:   { bg: '#fffbeb', color: '#d97706' },
  HIGH:     { bg: '#fef2f2', color: '#dc2626' },
  CRITICAL: { bg: '#f5f3ff', color: '#7c3aed' },
};

function PriorityPill({ priority }) {
  const c = PRIORITY_PILL_MAP[priority] || PRIORITY_PILL_MAP.MEDIUM;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: c.bg, color: c.color, flexShrink: 0, whiteSpace: 'nowrap' }}>
      {priority}
    </span>
  );
}

function IconLayoutDashboard({ size = 24, style: st }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={st}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

/* ── Styles ──────────────────────────────────────────────────────────────────  */

const s = {
  banner: {
    background: 'linear-gradient(135deg, #4f6fff 0%, #00e5c3 100%)',
    borderRadius: 16, padding: '28px 32px', marginBottom: 28,
    boxShadow: '0 4px 20px rgba(79,111,255,0.2)',
  },
  bannerContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  bannerText:    {},
  bannerTitle:   { fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.3px' },
  bannerSub:     { fontSize: 14, color: 'rgba(255,255,255,0.85)', margin: 0 },
  bannerIcon:    { opacity: 0.6 },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 14,
    marginBottom: 28,
  },
  statCard: {
    borderRadius: 14, padding: '18px', cursor: 'pointer', textAlign: 'left',
    transition: 'all 0.15s', fontFamily: 'inherit',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  statValue:   { fontSize: 30, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 },
  statLabel:   { fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: 500 },
  statIconBox: { width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statFooter:  { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, marginTop: 14 },

  sectionHeader: { marginBottom: 14 },
  sectionTitle:  { fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 2px', letterSpacing: '-0.2px' },
  sectionSub:    { fontSize: 13, color: '#64748b', margin: 0 },

  actionsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 12, marginBottom: 28,
  },
  actionCard: {
    display: 'flex', alignItems: 'center', gap: 14,
    background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12,
    padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
    transition: 'all 0.15s', fontFamily: 'inherit',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  actionIconBox: { width: 42, height: 42, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  actionText:    { flex: 1 },
  actionLabel:   { fontSize: 13, fontWeight: 700, color: '#0f172a' },
  actionDesc:    { fontSize: 12, color: '#64748b', marginTop: 2 },

  tableCard: {
    background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14,
    overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  tableCardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px', borderBottom: '1px solid #f1f5f9',
  },
  viewAllBtn: {
    fontSize: 12, fontWeight: 700, color: '#4f6fff', background: 'none',
    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
  },
  tableRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 16px', borderBottom: '1px solid #f8fafc',
  },
  tableEmpty: { padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 },
  rowPrimary: { fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rowSub:     { fontSize: 11, color: '#94a3b8', marginTop: 2 },

  statusCard:  { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  statusRow:   { display: 'flex', flexWrap: 'wrap', gap: 18 },
  statusItem:  { display: 'flex', alignItems: 'center', gap: 8 },
  statusDot:   { width: 8, height: 8, borderRadius: '50%', display: 'inline-block', flexShrink: 0 },
  statusLabel: { fontSize: 13, color: '#475569', fontWeight: 500 },
  statusBadge: { fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 },
};