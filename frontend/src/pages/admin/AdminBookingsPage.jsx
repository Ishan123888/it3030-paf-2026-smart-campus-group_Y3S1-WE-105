import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { approveBooking, getAllBookings, rejectBooking } from '../../api/api';

const FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

const statusColors = {
  PENDING:   { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  APPROVED:  { bg: '#f0fdf4', color: '#059669', border: '#bbf7d0' },
  REJECTED:  { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  CANCELLED: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
};

const PAGE_SIZE = 10;

export default function AdminBookingsPage() {
  const [bookings,  setBookings]  = useState([]);
  const [status,    setStatus]    = useState('ALL');
  const [userEmail, setUserEmail] = useState('');
  const [message,   setMessage]   = useState('');
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3500);
  };

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (status !== 'ALL') params.status = status;
      if (userEmail.trim()) params.userEmail = userEmail.trim();
      const res = await getAllBookings(params);
      setBookings(res.data || []);
      setPage(1);
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [status, userEmail]);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  const handleApprove = async (bookingId) => {
    try {
      await approveBooking(bookingId);
      showMessage('✅ Booking approved successfully.');
      loadBookings();
    } catch (err) {
      showMessage(err.response?.data?.message || '❌ Unable to approve booking.');
    }
  };

  const handleReject = async (bookingId) => {
    const reason = window.prompt('Enter rejection reason');
    if (!reason) return;
    try {
      await rejectBooking(bookingId, reason);
      showMessage('✅ Booking rejected successfully.');
      loadBookings();
    } catch (err) {
      showMessage(err.response?.data?.message || '❌ Unable to reject booking.');
    }
  };

  const totalPages = Math.ceil(bookings.length / PAGE_SIZE);
  const paged = bookings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = FILTERS.slice(1).reduce((acc, f) => {
    acc[f] = bookings.filter(b => b.status === f).length;
    return acc;
  }, {});

  return (
    <AdminLayout title="Booking Management">
      {/* Hero */}
      <div style={{ background:'linear-gradient(135deg,#4f6fff,#00e5c3)', borderRadius:18, padding:'26px 28px', marginBottom:22 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.78)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Module B</div>
        <h1 style={{ color:'#fff', fontSize:26, fontWeight:800, margin:'6px 0 4px' }}>Booking Management</h1>
        <p style={{ color:'rgba(255,255,255,0.88)', margin:0, fontSize:14 }}>Review student requests, approve them, or reject them with a reason.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {FILTERS.slice(1).map(f => (
          <div key={f} style={{ background:statusColors[f].bg, border:`1px solid ${statusColors[f].border}`, borderRadius:12, padding:'16px 20px' }}>
            <div style={{ fontSize:26, fontWeight:800, color:statusColors[f].color, lineHeight:1 }}>
              {counts[f]}
            </div>
            <div style={{ color:'#64748b', fontSize:11, marginTop:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{f}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display:'flex', justifyContent:'space-between', gap:12, flexWrap:'wrap', marginBottom:16 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {FILTERS.map(item => (
            <button key={item} onClick={() => setStatus(item)}
              style={{ border:'1.5px solid', borderColor: status===item?'#0f172a':'#cbd5e1', background: status===item?'#0f172a':'#fff', color: status===item?'#fff':'#475569', borderRadius:999, padding:'8px 16px', cursor:'pointer', fontWeight:700, fontSize:13 }}>
              {item}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <input value={userEmail} onChange={e => setUserEmail(e.target.value)}
            placeholder="Filter by student email"
            style={{ minWidth:220, padding:'9px 12px', borderRadius:10, border:'1.5px solid #cbd5e1', fontSize:13, outline:'none' }} />
          <button onClick={loadBookings}
            style={{ background:'#4f6fff', color:'#fff', border:'none', borderRadius:10, padding:'9px 18px', cursor:'pointer', fontWeight:700, fontSize:13 }}>
            Apply
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div style={{ padding:'12px 16px', borderRadius:10, marginBottom:16, background: message.includes('✅')?'#f0fdf4':'#fef2f2', border:`1px solid ${message.includes('✅')?'#bbf7d0':'#fecaca'}`, color: message.includes('✅')?'#15803d':'#dc2626', fontSize:14, fontWeight:600 }}>
          {message}
        </div>
      )}

      {/* Table */}
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ padding:48, textAlign:'center', color:'#64748b' }}>
            <div style={{ width:32, height:32, border:'3px solid #e2e8f0', borderTop:'3px solid #4f6fff', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            Loading bookings...
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ padding:48, textAlign:'center', color:'#64748b' }}>No bookings found.</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
                {['Resource', 'Student', 'Schedule', 'Purpose', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding:'14px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((b, idx) => (
                <tr key={b.id} style={{ borderBottom:'1px solid #f1f5f9', background: idx%2===0?'#fff':'#fafafa' }}>
                  <td style={{ padding:'14px 16px', verticalAlign:'top' }}>
                    <div style={{ color:'#0f172a', fontWeight:700, fontSize:14 }}>{b.resourceName}</div>
                    <div style={{ color:'#64748b', fontSize:12, marginTop:2 }}>Attendees: {b.expectedAttendees}</div>
                  </td>
                  <td style={{ padding:'14px 16px', verticalAlign:'top' }}>
                    <div style={{ color:'#0f172a', fontWeight:600, fontSize:14 }}>{b.userName}</div>
                    <div style={{ color:'#64748b', fontSize:12, marginTop:2 }}>{b.userEmail}</div>
                  </td>
                  <td style={{ padding:'14px 16px', verticalAlign:'top' }}>
                    <div style={{ color:'#0f172a', fontWeight:600, fontSize:14 }}>{b.bookingDate}</div>
                    <div style={{ color:'#64748b', fontSize:12, marginTop:2 }}>{b.startTime} - {b.endTime}</div>
                  </td>
                  <td style={{ padding:'14px 16px', verticalAlign:'top', maxWidth:180 }}>
                    <div style={{ color:'#0f172a', fontSize:13, wordBreak:'break-word' }}>{b.purpose}</div>
                    {b.adminReason && <div style={{ color:'#64748b', fontSize:12, marginTop:4 }}>Reason: {b.adminReason}</div>}
                  </td>
                  <td style={{ padding:'14px 16px', verticalAlign:'top' }}>
                    <span style={{ display:'inline-block', padding:'5px 12px', borderRadius:999, fontSize:11, fontWeight:800, background: statusColors[b.status]?.bg||'#f1f5f9', color: statusColors[b.status]?.color||'#475569', border:`1px solid ${statusColors[b.status]?.border||'#e2e8f0'}` }}>
                      {b.status}
                    </span>
                  </td>
                  <td style={{ padding:'14px 16px', verticalAlign:'top' }}>
                    {b.status === 'PENDING' ? (
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={() => handleApprove(b.id)}
                          style={{ background:'#059669', color:'#fff', border:'none', borderRadius:8, padding:'8px 14px', cursor:'pointer', fontWeight:700, fontSize:12 }}>
                          Approve
                        </button>
                        <button onClick={() => handleReject(b.id)}
                          style={{ background:'#dc2626', color:'#fff', border:'none', borderRadius:8, padding:'8px 14px', cursor:'pointer', fontWeight:700, fontSize:12 }}>
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ color:'#94a3b8', fontSize:13, fontWeight:600 }}>Reviewed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && bookings.length > PAGE_SIZE && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderTop:'1px solid #e2e8f0', background:'#f8fafc' }}>
            <span style={{ fontSize:13, color:'#64748b' }}>
              Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, bookings.length)} of {bookings.length} bookings
            </span>
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                style={{ padding:'6px 14px', borderRadius:8, border:'1.5px solid #e2e8f0', background: page===1?'#f1f5f9':'#fff', color: page===1?'#94a3b8':'#0f172a', fontWeight:600, fontSize:13, cursor: page===1?'not-allowed':'pointer' }}>
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_,i) => i+1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  style={{ width:34, height:34, borderRadius:8, border:'1.5px solid', borderColor: p===page?'#4f6fff':'#e2e8f0', background: p===page?'#4f6fff':'#fff', color: p===page?'#fff':'#0f172a', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
                style={{ padding:'6px 14px', borderRadius:8, border:'1.5px solid #e2e8f0', background: page===totalPages?'#f1f5f9':'#fff', color: page===totalPages?'#94a3b8':'#0f172a', fontWeight:600, fontSize:13, cursor: page===totalPages?'not-allowed':'pointer' }}>
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
