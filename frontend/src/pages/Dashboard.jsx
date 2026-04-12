import { useAuth } from "../context/AuthContext";
// ✅ Navbar import ඉවත් කළා
import { useNavigate } from "react-router-dom";
import BackgroundSlideshow, { toImgurDirect } from "../components/common/BackgroundSlideshow";

const DASH_BG = [toImgurDirect("https://imgur.com/t4yWwhI")];

export default function Dashboard() {
  const { user, loading, isAdmin, isStaff } = useAuth();
  const navigate = useNavigate();

  if (loading) return (
    <BackgroundSlideshow slides={DASH_BG} className="min-h-screen pt-16">
      <div style={styles.loaderContainer}>
        <div style={styles.spinner} />
        <span style={styles.loaderText}>Loading Dashboard...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </BackgroundSlideshow>
  );

  const isAuthenticated = !!(user && user.email);
  const displayName = isAuthenticated ? user.name?.split(' ')[0] : "Guest";

  const actions = [
    { id: 1, label: "My Bookings",  icon: "📅", path: "/dashboard/bookings",  color: "#4f6fff", show: isAuthenticated },
    { id: 2, label: "Incidents",    icon: "🔧", path: "/dashboard/incidents", color: "#ff5b8d", show: isAuthenticated && !isAdmin() },
    { id: 3, label: "Resources",    icon: "🏛️", path: "/dashboard/resources", color: "#00e5c3", show: true },
    { id: 4, label: "Admin Panel",  icon: "⚙️", path: "/admin",               color: "#f59e0b", show: isAdmin() },
    { id: 5, label: "Staff Portal", icon: "👨‍🏫", path: "/staff",               color: "#8b5cf6", show: isStaff() },
  ];

  return (
    // ✅ <Navbar /> ඉවත් කළා — App.js එකේ global Navbar use වෙනවා
    <BackgroundSlideshow slides={DASH_BG} className="min-h-screen pt-16">
    <div style={styles.container}>
      <div style={styles.contentWrapper}>
        <header style={{ marginBottom: 40 }}>
          <h1 style={styles.welcomeText}>Welcome back, {displayName}! 👋</h1>
          <p style={styles.subText}>
            {isAuthenticated
              ? "Here's what's happening with your SmartCampus account today."
              : "Login to your account to manage bookings and view personalized insights."}
          </p>
        </header>

        {isAuthenticated && (
          <div style={styles.profileCard} className="card-3d">
            <img
              src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=4f6fff&color=fff`}
              alt="profile"
              style={styles.avatar}
            />
            <div style={{ flex: 1 }}>
              <h2 style={styles.userName}>{user.name}</h2>
              <p style={styles.userEmail}>{user.email}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(user.roles || ["ROLE_USER"]).map(role => (
                  <span key={role} style={{
                    ...styles.roleBadge,
                    background: role === "ROLE_ADMIN" ? "rgba(239,68,68,0.12)" : "rgba(79,111,255,0.12)",
                    color:      role === "ROLE_ADMIN" ? "#ef4444"              : "#4f6fff",
                    border:     `1px solid ${role === "ROLE_ADMIN" ? "rgba(239,68,68,0.2)" : "rgba(79,111,255,0.2)"}`,
                  }}>
                    {role.replace("ROLE_", "")}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <h3 style={styles.sectionTitle}>Quick Actions</h3>

        <div style={styles.grid}>
          {actions.filter(a => a.show).map(item => (
            <button
              key={item.id}
              className="card-3d"
              onClick={() => navigate(item.path)}
              style={{ ...styles.actionButton, color: item.color, border: `1px solid ${item.color}22` }}
            >
              <div style={{ fontSize: 36, marginBottom: 14 }}>{item.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#e8ecff" }}>{item.label}</div>
            </button>
          ))}
        </div>

        {!isAuthenticated && (
          <div style={styles.guestCTA} className="card-3d">
            <h4 style={{ color: "#e8ecff", margin: "0 0 8px 0", fontSize: 18 }}>Unlock Full Access</h4>
            <button onClick={() => navigate("/login")} style={styles.signInBtn}>Sign In Now</button>
          </div>
        )}
      </div>
    </div>
    </BackgroundSlideshow>
  );
}

const styles = {
  container:       { minHeight: "100vh", backgroundColor: "transparent", paddingTop: 24, fontFamily: "'DM Sans', sans-serif" },
  contentWrapper:  { padding: "0 24px 40px", maxWidth: "900px", margin: "0 auto" },
  loaderContainer: { minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", flexDirection: "column", gap: 15 },
  spinner:         { width: 40, height: 40, border: "3px solid #1e2a3a", borderTop: "3px solid #4f6fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  loaderText:      { color: "#4f6fff", fontSize: 14, fontWeight: 500 },
  welcomeText:     { color: "#ffffff", fontSize: 32, fontWeight: 800, marginBottom: 8, textShadow: "0 18px 50px rgba(0,0,0,.35)" },
  subText:         { color: "rgba(255,255,255,0.70)", fontSize: 16 },
  profileCard:     { background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 20, padding: 28, marginBottom: 40, display: "flex", alignItems: "center", gap: 24, boxShadow: "0 18px 60px rgba(0,0,0,0.25)", backdropFilter: "blur(14px)" },
  avatar:          { width: 85, height: 85, borderRadius: "50%", border: "3px solid #4f6fff", objectFit: "cover" },
  userName:        { margin: "0 0 6px", fontSize: "1.4rem", color: "#e8ecff", fontWeight: 700 },
  userEmail:       { margin: "0 0 14px", color: "rgba(255,255,255,0.60)", fontSize: 14 },
  roleBadge:       { padding: "5px 14px", borderRadius: 30, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" },
  sectionTitle:    { color: "#ffffff", fontSize: 18, fontWeight: 800, marginBottom: 20, textShadow: "0 18px 50px rgba(0,0,0,.35)" },
  grid:            { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20 },
  actionButton:    { background: "rgba(0,0,0,0.35)", borderRadius: 16, padding: "30px 20px", cursor: "pointer", textAlign: "center", transition: "all 0.2s ease", outline: "none", boxShadow: "0 18px 60px rgba(0,0,0,0.22)", backdropFilter: "blur(14px)" },
  guestCTA:        { marginTop: 48, padding: "32px", borderRadius: 16, background: "rgba(0,0,0,0.28)", border: "1px dashed rgba(255,255,255,0.18)", textAlign: "center", backdropFilter: "blur(14px)" },
  signInBtn:       { background: "linear-gradient(135deg, #4f6fff, #3b5bdb)", color: "white", border: "none", padding: "12px 32px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 15 },
};
