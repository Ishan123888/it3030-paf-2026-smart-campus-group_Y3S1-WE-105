import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { approveBooking, getAllBookings, rejectBooking } from '../../api/api';

const FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState('ALL');
  const [userEmail, setUserEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (status !== 'ALL') params.status = status;
      if (userEmail.trim()) params.userEmail = userEmail.trim();
      const res = await getAllBookings(params);
      setBookings(res.data || []);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [status, userEmail]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleApprove = async (bookingId) => {
    try {
      await approveBooking(bookingId);
      setMessage('Booking approved successfully.');
      loadBookings();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to approve booking.');
    }
  };

  const handleReject = async (bookingId) => {
    const reason = window.prompt('Enter rejection reason');
    if (!reason) return;
    try {
      await rejectBooking(bookingId, reason);
      setMessage('Booking rejected successfully.');
      loadBookings();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to reject booking.');
    }
  };

  return (
    <AdminLayout title="Booking Management">
      <div style={s.hero}>
        <div>
          <div style={s.eyebrow}>Module B</div>
          <h1 style={s.title}>Booking Management</h1>
          <p style={s.sub}>Review student requests, approve them, or reject them with a reason.</p>
        </div>
      </div>

      <div style={s.toolbar}>
        <div style={s.filterRow}>
          {FILTERS.map(item => (
            <button key={item} onClick={() => setStatus(item)} style={{ ...s.chip, ...(status === item ? s.chipActive : {}) }}>
              {item}
            </button>
          ))}
        </div>
        <div style={s.searchRow}>
          <input
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="Filter by student email"
            style={s.input}
          />
          <button onClick={loadBookings} style={s.searchBtn}>Apply</button>
        </div>
      </div>

      {message && <div style={s.message}>{message}</div>}

      <div style={s.tableWrap}>
        {loading ? (
          <div style={s.loading}>Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div style={s.loading}>No bookings found.</div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['Resource', 'Student', 'Schedule', 'Purpose', 'Status', 'Actions'].map(head => (
                  <th key={head} style={s.th}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking.id} style={s.tr}>
                  <td style={s.td}>
                    <div style={s.primaryText}>{booking.resourceName}</div>
                    <div style={s.secondaryText}>Attendees: {booking.expectedAttendees}</div>
                  </td>
                  <td style={s.td}>
                    <div style={s.primaryText}>{booking.userName}</div>
                    <div style={s.secondaryText}>{booking.userEmail}</div>
                  </td>
                  <td style={s.td}>
                    <div style={s.primaryText}>{booking.bookingDate}</div>
                    <div style={s.secondaryText}>{booking.startTime} - {booking.endTime}</div>
                  </td>
                  <td style={s.td}>
                    <div style={s.primaryText}>{booking.purpose}</div>
                    {booking.adminReason && <div style={s.secondaryText}>Reason: {booking.adminReason}</div>}
                  </td>
                  <td style={s.td}><StatusBadge status={booking.status} /></td>
                  <td style={s.td}>
                    <div style={s.actions}>
                      {booking.status === 'PENDING' && (
                        <>
                          <button onClick={() => handleApprove(booking.id)} style={s.approveBtn}>Approve</button>
                          <button onClick={() => handleReject(booking.id)} style={s.rejectBtn}>Reject</button>
                        </>
                      )}
                      {booking.status !== 'PENDING' && <span style={s.secondaryText}>Reviewed</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
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
  hero: { background: 'linear-gradient(135deg,#4f6fff,#00e5c3)', borderRadius: 18, padding: '26px 28px', marginBottom: 18 },
  eyebrow: { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.78)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  title: { color: '#fff', fontSize: 28, fontWeight: 800, margin: '8px 0' },
  sub: { color: 'rgba(255,255,255,0.88)', margin: 0 },
  toolbar: { display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 },
  filterRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  chip: { border: '1px solid #cbd5e1', background: '#fff', color: '#475569', borderRadius: 999, padding: '9px 14px', cursor: 'pointer', fontWeight: 700 },
  chipActive: { background: '#0f172a', color: '#fff', borderColor: '#0f172a' },
  searchRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  input: { minWidth: 240, padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1' },
  searchBtn: { background: '#4f6fff', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', fontWeight: 700 },
  message: { marginBottom: 16, padding: '12px 14px', borderRadius: 12, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' },
  tableWrap: { background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  loading: { padding: 24, color: '#64748b', textAlign: 'center' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', background: '#f8fafc', color: '#64748b', fontSize: 12, textTransform: 'uppercase' },
  tr: { borderTop: '1px solid #e2e8f0' },
  td: { padding: '14px 16px', verticalAlign: 'top' },
  primaryText: { color: '#0f172a', fontWeight: 700, marginBottom: 4 },
  secondaryText: { color: '#64748b', fontSize: 13, lineHeight: 1.5 },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  approveBtn: { background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 12px', cursor: 'pointer', fontWeight: 700 },
  rejectBtn: { background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 12px', cursor: 'pointer', fontWeight: 700 },
  badge: { display: 'inline-block', padding: '6px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800 },
};
