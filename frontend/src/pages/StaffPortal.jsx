import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BackgroundSlideshow, { toImgurDirect } from '../components/common/BackgroundSlideshow';

const STAFF_BG = [toImgurDirect('https://imgur.com/TgLNZBK')];

export default function StaffPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <BackgroundSlideshow slides={STAFF_BG} className="min-h-screen pt-16">
      <div style={styles.container}>
        <div style={styles.card} className="card-3d">
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Staff Portal</h1>
              <p style={styles.subtitle}>
                Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}. Manage incidents, service tasks, and staff workflows from one place.
              </p>
            </div>
          </div>

          <div style={styles.grid}>
            <button style={{ ...styles.action, borderColor: '#22c55e' }} onClick={() => navigate('/dashboard/incidents')}>
              <div style={styles.icon}>⚠️</div>
              <div>
                <h2 style={styles.actionTitle}>Incident Queue</h2>
                <p style={styles.actionText}>View and triage tickets assigned to staff and technicians.</p>
              </div>
            </button>

            <button style={{ ...styles.action, borderColor: '#0ea5e9' }} onClick={() => navigate('/dashboard/resources')}>
              <div style={styles.icon}>🏛️</div>
              <div>
                <h2 style={styles.actionTitle}>Resource Catalogue</h2>
                <p style={styles.actionText}>Browse resources, verify availability, and support student requests.</p>
              </div>
            </button>

            <button style={{ ...styles.action, borderColor: '#f59e0b' }} onClick={() => navigate('/dashboard/bookings')}>
              <div style={styles.icon}>📅</div>
              <div>
                <h2 style={styles.actionTitle}>My Bookings</h2>
                <p style={styles.actionText}>Review booking requests and follow up on student reservations.</p>
              </div>
            </button>
          </div>

          <div style={styles.note}>
            <strong>Note:</strong> This portal is reserved for staff accounts. If you are an administrator, use the admin interface instead.
          </div>
        </div>
      </div>
    </BackgroundSlideshow>
  );
}

const styles = {
  container: { minHeight: '100vh', padding: '28px 24px 40px', maxWidth: 980, margin: '0 auto', fontFamily: "'DM Sans', sans-serif" },
  card: { background: 'rgba(0,0,0,0.36)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 24, padding: 28, boxShadow: '0 28px 80px rgba(0,0,0,0.28)', backdropFilter: 'blur(14px)' },
  header: { marginBottom: 30 },
  title: { color: '#e8ecff', fontSize: 34, fontWeight: 800, margin: 0 },
  subtitle: { color: 'rgba(255,255,255,0.72)', fontSize: 16, marginTop: 12, lineHeight: 1.7 },
  grid: { display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' },
  action: { border: '1px solid', borderRadius: 20, background: 'rgba(255,255,255,0.05)', padding: 24, textAlign: 'left', cursor: 'pointer', transition: 'transform 0.18s ease, box-shadow 0.18s ease', boxShadow: '0 18px 60px rgba(0,0,0,0.2)' },
  icon: { fontSize: 32, marginBottom: 16 },
  actionTitle: { margin: 0, color: '#ffffff', fontSize: 18, fontWeight: 700 },
  actionText: { margin: '10px 0 0', color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 1.7 },
  note: { marginTop: 28, padding: '16px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 13 },
};
