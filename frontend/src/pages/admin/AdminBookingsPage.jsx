import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { approveBooking, cancelBooking, getAllBookings, rejectBooking } from '../../api/api';

const FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState('ALL');
  const [userEmail, setUserEmail] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [rejectingBooking, setRejectingBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (status !== 'ALL') params.status = status;
      if (userEmail.trim()) params.userEmail = userEmail.trim();
      if (bookingDate) params.bookingDate = bookingDate;
      const res = await getAllBookings(params);
      setBookings(res.data || []);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [bookingDate, status, userEmail]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const summary = useMemo(() => ({
    total: bookings.length,
    pending: bookings.filter((item) => item.status === 'PENDING').length,
    approved: bookings.filter((item) => item.status === 'APPROVED').length,
    rejected: bookings.filter((item) => item.status === 'REJECTED').length,
    cancelled: bookings.filter((item) => item.status === 'CANCELLED').length,
  }), [bookings]);

  const pendingBookings = useMemo(
    () => bookings.filter((item) => item.status === 'PENDING'),
    [bookings]
  );

  const clearFilters = () => {
    setStatus('ALL');
    setUserEmail('');
    setBookingDate('');
    setMessage('');
  };

  const handleApprove = async (bookingId) => {
    try {
      await approveBooking(bookingId);
      setMessage('Booking approved successfully.');
      loadBookings();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to approve booking.');
    }
  };

  const openRejectModal = (booking) => {
    setRejectingBooking(booking);
    setRejectReason('');
  };

  const closeRejectModal = () => {
    setRejectingBooking(null);
    setRejectReason('');
  };

  const handleReject = async () => {
    if (!rejectingBooking || !rejectReason.trim()) return;
    try {
      await rejectBooking(rejectingBooking.id, rejectReason.trim());
      setMessage('Booking rejected successfully.');
      closeRejectModal();
      loadBookings();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to reject booking.');
    }
  };

  const handleCancel = async (bookingId) => {
    const confirmed = window.confirm('Cancel this booking?');
    if (!confirmed) return;
    try {
      await cancelBooking(bookingId);
      setMessage('Booking cancelled successfully.');
      loadBookings();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to cancel booking.');
    }
  };

  return (
    <AdminLayout title="Booking Management">
      <div style={s.hero}>
        <div>
          <div style={s.eyebrow}>Module B</div>
          <h1 style={s.title}>Booking Approval Center</h1>
          <p style={s.sub}>Review pending requests, approve them quickly, reject with a clear reason, or cancel active bookings when needed.</p>
        </div>
        <div style={s.heroMeta}>
          <span style={s.heroPill}>Pending Queue: {summary.pending}</span>
          <span style={s.heroPill}>Today Filters Ready</span>
        </div>
      </div>

      <div style={s.statsGrid}>
        <StatCard label="Total Requests" value={summary.total} tone="blue" />
        <StatCard label="Pending Review" value={summary.pending} tone="amber" />
        <StatCard label="Approved" value={summary.approved} tone="green" />
        <StatCard label="Rejected / Cancelled" value={summary.rejected + summary.cancelled} tone="slate" />
      </div>

      <div style={s.toolbar}>
        <div style={s.filterRow}>
          {FILTERS.map((item) => (
            <button
              key={item}
              onClick={() => setStatus(item)}
              style={{ ...s.chip, ...(status === item ? s.chipActive : {}) }}
            >
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
          <input
            type="date"
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            style={s.input}
          />
          <button onClick={loadBookings} style={s.searchBtn}>Apply</button>
          <button onClick={clearFilters} style={s.secondaryBtn}>Reset</button>
        </div>
      </div>

      {message && <div style={s.message}>{message}</div>}

      <div style={s.panel}>
        <div style={s.sectionHead}>
          <div>
            <h2 style={s.sectionTitle}>Pending Approval Queue</h2>
            <p style={s.sectionSub}>Students waiting for admin action appear here first.</p>
          </div>
          <span style={s.queueCount}>{pendingBookings.length} pending</span>
        </div>

        {loading ? (
          <div style={s.loading}>Loading booking requests...</div>
        ) : pendingBookings.length === 0 ? (
          <div style={s.emptyState}>No pending booking requests right now.</div>
        ) : (
          <div style={s.pendingGrid}>
            {pendingBookings.map((booking) => (
              <div key={booking.id} style={s.pendingCard}>
                <div style={s.pendingTop}>
                  <div>
                    <div style={s.cardTitle}>{booking.resourceName}</div>
                    <div style={s.cardSub}>{booking.bookingDate} | {booking.startTime} - {booking.endTime}</div>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>

                <div style={s.pendingMeta}>
                  <MetaBlock label="Student" value={booking.userName || booking.userEmail} />
                  <MetaBlock label="Email" value={booking.userEmail} />
                  <MetaBlock label="Attendees" value={String(booking.expectedAttendees || 1)} />
                </div>

                <div style={s.reasonPanel}>
                  <div style={s.reasonLabel}>Purpose</div>
                  <div style={s.reasonValue}>{booking.purpose}</div>
                </div>

                <div style={s.actions}>
                  <button onClick={() => handleApprove(booking.id)} style={s.approveBtn}>Approve</button>
                  <button onClick={() => openRejectModal(booking)} style={s.rejectBtn}>Reject</button>
                  <button onClick={() => handleCancel(booking.id)} style={s.cancelBtn}>Cancel</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={s.tableWrap}>
        <div style={s.sectionHead}>
          <div>
            <h2 style={s.sectionTitle}>All Booking Requests</h2>
            <p style={s.sectionSub}>Review every request with status, reason, and available actions.</p>
          </div>
        </div>

        {loading ? (
          <div style={s.loading}>Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div style={s.loading}>No bookings found.</div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['Resource', 'Student', 'Schedule', 'Purpose', 'Review', 'Actions'].map((head) => (
                  <th key={head} style={s.th}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
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
                  </td>
                  <td style={s.td}>
                    <StatusBadge status={booking.status} />
                    {booking.adminReason && <div style={s.reviewNote}>Reason: {booking.adminReason}</div>}
                    {booking.reviewedBy && <div style={s.reviewNote}>By: {booking.reviewedBy}</div>}
                  </td>
                  <td style={s.td}>
                    <div style={s.actions}>
                      {booking.status === 'PENDING' && (
                        <>
                          <button onClick={() => handleApprove(booking.id)} style={s.approveBtn}>Approve</button>
                          <button onClick={() => openRejectModal(booking)} style={s.rejectBtn}>Reject</button>
                          <button onClick={() => handleCancel(booking.id)} style={s.cancelBtn}>Cancel</button>
                        </>
                      )}
                      {booking.status === 'APPROVED' && (
                        <button onClick={() => handleCancel(booking.id)} style={s.cancelBtn}>Cancel</button>
                      )}
                      {booking.status === 'REJECTED' && <span style={s.secondaryText}>Rejected</span>}
                      {booking.status === 'CANCELLED' && <span style={s.secondaryText}>Cancelled</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {rejectingBooking && (
        <div style={s.modalBackdrop}>
          <div style={s.modalCard}>
            <h3 style={s.modalTitle}>Reject Booking Request</h3>
            <p style={s.modalSub}>
              {rejectingBooking.resourceName} on {rejectingBooking.bookingDate} from {rejectingBooking.startTime} to {rejectingBooking.endTime}
            </p>
            <label style={s.modalLabel}>Reason</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this request was rejected"
              style={s.textarea}
            />
            <div style={s.modalActions}>
              <button onClick={closeRejectModal} style={s.secondaryBtn}>Close</button>
              <button onClick={handleReject} disabled={!rejectReason.trim()} style={s.rejectBtn}>Submit Rejection</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function StatCard({ label, value, tone }) {
  const toneMap = {
    blue: { accent: '#4f6fff', bg: '#eef2ff' },
    amber: { accent: '#d97706', bg: '#fff7ed' },
    green: { accent: '#16a34a', bg: '#f0fdf4' },
    slate: { accent: '#475569', bg: '#f8fafc' },
  };
  const colors = toneMap[tone] || toneMap.blue;

  return (
    <div style={{ ...s.statCard, background: colors.bg }}>
      <div style={{ ...s.statLine, background: colors.accent }} />
      <div style={s.statValue}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

function MetaBlock({ label, value }) {
  return (
    <div style={s.metaBlock}>
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
  hero: { background: 'linear-gradient(135deg,#4f6fff,#00e5c3)', borderRadius: 18, padding: '26px 28px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' },
  heroMeta: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' },
  heroPill: { background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.22)', color: '#fff', borderRadius: 999, padding: '8px 12px', fontSize: 12, fontWeight: 700 },
  eyebrow: { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.78)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  title: { color: '#fff', fontSize: 28, fontWeight: 800, margin: '8px 0' },
  sub: { color: 'rgba(255,255,255,0.88)', margin: 0, maxWidth: 720 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 18 },
  statCard: { position: 'relative', borderRadius: 16, border: '1px solid #e2e8f0', padding: '18px 16px', overflow: 'hidden' },
  statLine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  statValue: { color: '#0f172a', fontSize: 28, fontWeight: 800 },
  statLabel: { color: '#64748b', fontSize: 13, marginTop: 6 },
  toolbar: { display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 },
  filterRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  chip: { border: '1px solid #cbd5e1', background: '#fff', color: '#475569', borderRadius: 999, padding: '9px 14px', cursor: 'pointer', fontWeight: 700 },
  chipActive: { background: '#0f172a', color: '#fff', borderColor: '#0f172a' },
  searchRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  input: { minWidth: 200, padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff' },
  searchBtn: { background: '#4f6fff', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', fontWeight: 700 },
  secondaryBtn: { background: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', fontWeight: 700 },
  message: { marginBottom: 16, padding: '12px 14px', borderRadius: 12, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' },
  panel: { background: '#fff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 18, marginBottom: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  sectionHead: { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap' },
  sectionTitle: { color: '#0f172a', fontSize: 20, fontWeight: 800, margin: 0 },
  sectionSub: { color: '#64748b', margin: '6px 0 0 0', fontSize: 14 },
  queueCount: { background: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0', borderRadius: 999, padding: '8px 12px', fontSize: 12, fontWeight: 700 },
  pendingGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 },
  pendingCard: { border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, background: 'linear-gradient(180deg,#ffffff,#f8fafc)' },
  pendingTop: { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 14 },
  cardTitle: { color: '#0f172a', fontWeight: 800, fontSize: 17 },
  cardSub: { color: '#64748b', fontSize: 13, marginTop: 5 },
  pendingMeta: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 14 },
  metaBlock: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px' },
  metaLabel: { color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', marginBottom: 4, fontWeight: 700 },
  metaValue: { color: '#0f172a', fontWeight: 700, fontSize: 13, wordBreak: 'break-word' },
  reasonPanel: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', marginBottom: 14 },
  reasonLabel: { color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 },
  reasonValue: { color: '#334155', fontSize: 14, lineHeight: 1.5 },
  tableWrap: { background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  loading: { padding: 24, color: '#64748b', textAlign: 'center' },
  emptyState: { padding: 24, borderRadius: 14, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', textAlign: 'center' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', background: '#f8fafc', color: '#64748b', fontSize: 12, textTransform: 'uppercase' },
  tr: { borderTop: '1px solid #e2e8f0' },
  td: { padding: '14px 16px', verticalAlign: 'top' },
  primaryText: { color: '#0f172a', fontWeight: 700, marginBottom: 4 },
  secondaryText: { color: '#64748b', fontSize: 13, lineHeight: 1.5 },
  reviewNote: { color: '#64748b', fontSize: 12, marginTop: 8, lineHeight: 1.5 },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  approveBtn: { background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 12px', cursor: 'pointer', fontWeight: 700 },
  rejectBtn: { background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 12px', cursor: 'pointer', fontWeight: 700 },
  cancelBtn: { background: '#475569', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 12px', cursor: 'pointer', fontWeight: 700 },
  badge: { display: 'inline-block', padding: '6px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800 },
  modalBackdrop: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 200 },
  modalCard: { width: '100%', maxWidth: 520, background: '#fff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 22, boxShadow: '0 24px 60px rgba(0,0,0,0.18)' },
  modalTitle: { margin: 0, color: '#0f172a', fontSize: 22, fontWeight: 800 },
  modalSub: { margin: '8px 0 16px 0', color: '#64748b', lineHeight: 1.5 },
  modalLabel: { display: 'block', color: '#334155', fontWeight: 700, fontSize: 13, marginBottom: 8 },
  textarea: { minHeight: 120, resize: 'vertical', width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', boxSizing: 'border-box' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16, flexWrap: 'wrap' },
};
