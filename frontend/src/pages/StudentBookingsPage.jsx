import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cancelBooking, getMyBookings } from '../api/api';
import BackgroundSlideshow, { toImgurDirect } from '../components/common/BackgroundSlideshow';

const DASH_BG = [toImgurDirect('https://imgur.com/t4yWwhI')];
const FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

export default function StudentBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyBookings(status === 'ALL' ? {} : { status });
      setBookings(res.data || []);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to load your bookings.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const stats = useMemo(() => ({
    total: bookings.length,
    approved: bookings.filter(item => item.status === 'APPROVED').length,
    pending: bookings.filter(item => item.status === 'PENDING').length,
  }), [bookings]);

  const handleCancel = async (bookingId) => {
    try {
      await cancelBooking(bookingId);
      setMessage('Booking cancelled successfully.');
      loadBookings();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to cancel booking.');
    }
  };

  return (
    <BackgroundSlideshow slides={DASH_BG} className="min-h-screen pt-16">
      <div style={s.page}>
        <div style={s.container}>
          <div style={s.hero}>
            <div>
              <div style={s.eyebrow}>Student Bookings</div>
              <h1 style={s.title}>My Bookings</h1>
              <p style={s.subtitle}>Track your requests, cancel them, or move them to a new time.</p>
            </div>
            <button onClick={() => navigate('/dashboard/resources')} style={s.primaryBtn}>Book a Resource</button>
          </div>

          <div style={s.statsRow}>
            <StatCard label="Total" value={stats.total} />
            <StatCard label="Pending" value={stats.pending} />
            <StatCard label="Approved" value={stats.approved} />
          </div>

          <div style={s.toolbar}>
            <div style={s.chips}>
              {FILTERS.map(item => (
                <button
                  key={item}
                  onClick={() => setStatus(item)}
                  style={{ ...s.chip, ...(status === item ? s.chipActive : {}) }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {message && <div style={s.message}>{message}</div>}

          {loading ? (
            <div style={s.emptyCard}>Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div style={s.emptyCard}>No bookings found for the selected filter.</div>
          ) : (
            <div style={s.grid}>
              {bookings.map(booking => (
                <div key={booking.id} style={s.card}>
                  <div style={s.cardHead}>
                    <div>
                      <h3 style={s.cardTitle}>{booking.resourceName}</h3>
                      <p style={s.cardSub}>{booking.bookingDate} | {booking.startTime} - {booking.endTime}</p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>

                  <div style={s.metaGrid}>
                    <Meta label="Purpose" value={booking.purpose} />
                    <Meta label="Attendees" value={booking.expectedAttendees} />
                  </div>

                  {booking.adminReason && (
                    <div style={s.reasonBox}>
                      <strong style={{ color: '#fff' }}>Note:</strong> {booking.adminReason}
                    </div>
                  )}

                  <div style={s.actions}>
                    <button onClick={() => navigate(`/dashboard/bookings/${booking.id}/reschedule`)} style={s.secondaryBtn}>
                      Reschedule
                    </button>
                    {(booking.status === 'PENDING' || booking.status === 'APPROVED') && (
                      <button onClick={() => handleCancel(booking.id)} style={s.dangerBtn}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </BackgroundSlideshow>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={s.statCard}>
      <div style={s.statValue}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div style={s.metaBox}>
      <div style={s.metaLabel}>{label}</div>
      <div style={s.metaValue}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    PENDING: { bg: '#fef3c7', color: '#92400e' },
    APPROVED: { bg: '#dcfce7', color: '#166534' },
    REJECTED: { bg: '#fee2e2', color: '#991b1b' },
    CANCELLED: { bg: '#e2e8f0', color: '#334155' },
  };
  return <span style={{ ...s.badge, background: map[status]?.bg, color: map[status]?.color }}>{status}</span>;
}

const s = {
  page: { minHeight: '100vh', background: 'transparent', padding: '24px 16px 48px', fontFamily: "'DM Sans', sans-serif" },
  container: { maxWidth: 1180, margin: '0 auto' },
  hero: { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 },
  eyebrow: { color: '#9fb0ff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' },
  title: { color: '#fff', fontSize: 34, margin: '6px 0', fontWeight: 800 },
  subtitle: { color: 'rgba(255,255,255,0.7)', margin: 0 },
  primaryBtn: { background: 'linear-gradient(135deg,#4f6fff,#00e5c3)', border: 'none', color: '#fff', padding: '12px 18px', borderRadius: 12, cursor: 'pointer', fontWeight: 700 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 18 },
  statCard: { background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 18, backdropFilter: 'blur(12px)' },
  statValue: { color: '#fff', fontSize: 28, fontWeight: 800 },
  statLabel: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
  toolbar: { marginBottom: 18 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 10 },
  chip: { border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(0,0,0,0.28)', color: '#cbd5e1', borderRadius: 999, padding: '9px 14px', cursor: 'pointer', fontWeight: 700 },
  chipActive: { background: '#4f6fff', color: '#fff', borderColor: '#4f6fff' },
  message: { marginBottom: 16, padding: '12px 14px', borderRadius: 12, background: 'rgba(79,111,255,0.16)', color: '#dbe4ff', border: '1px solid rgba(79,111,255,0.3)' },
  emptyCard: { background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 28, color: '#cbd5e1', textAlign: 'center' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 },
  card: { background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 18, boxShadow: '0 18px 60px rgba(0,0,0,0.22)', backdropFilter: 'blur(12px)' },
  cardHead: { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 14 },
  cardTitle: { color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 },
  cardSub: { color: '#94a3b8', margin: '4px 0 0 0', fontSize: 13 },
  badge: { padding: '6px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800 },
  metaGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  metaBox: { background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12 },
  metaLabel: { color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', marginBottom: 4 },
  metaValue: { color: '#fff', fontWeight: 600 },
  reasonBox: { marginTop: 14, padding: 12, borderRadius: 12, background: 'rgba(248,113,113,0.16)', border: '1px solid rgba(248,113,113,0.28)', color: '#fecaca' },
  actions: { display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' },
  secondaryBtn: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontWeight: 700 },
  dangerBtn: { background: '#ef4444', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontWeight: 700 },
};
