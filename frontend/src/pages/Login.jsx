import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    // ✅ oauth-callback process වෙද්දී Login redirect කරන්න එපා
    if (location.pathname === '/oauth-callback') return;
    
    if (!loading && user) {
      if (user.roles?.includes("ROLE_ADMIN")) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, loading, navigate, location]);

  const handleLogin = () => {
    window.location.href = "http://localhost:8081/oauth2/authorization/google";
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#060812"
      }}>
        <div style={{
          width: 36, height: 36,
          border: "3px solid #1e2a3a", borderTop: "3px solid #4f6fff",
          borderRadius: "50%", animation: "spin 0.8s linear infinite"
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #060812 0%, #0d1120 50%, #060812 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden",
    }}>
      {/* Background orbs */}
      <div style={{
        position: "absolute", width: 400, height: 400, borderRadius: "50%",
        background: "rgba(79,111,255,0.12)", filter: "blur(80px)",
        top: -100, left: -100, pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", width: 300, height: 300, borderRadius: "50%",
        background: "rgba(0,229,195,0.08)", filter: "blur(80px)",
        bottom: -50, right: -50, pointerEvents: "none",
      }} />

      {/* Login card */}
      <div style={{
        background: "rgba(13,17,32,0.9)",
        border: "1px solid rgba(99,130,255,0.2)",
        borderRadius: 24, padding: "48px 40px",
        width: "100%", maxWidth: 420,
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        textAlign: "center", position: "relative", zIndex: 1,
        backdropFilter: "blur(12px)",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18, margin: "0 auto 20px",
          background: "linear-gradient(135deg, #4f6fff, #7b6fff)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, boxShadow: "0 0 32px rgba(79,111,255,0.4)",
        }}>🏫</div>

        <h1 style={{ color: "#e8ecff", margin: "0 0 8px", fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>
          Smart<span style={{ color: "#4f6fff" }}>Campus</span>
        </h1>
        <p style={{ color: "#6b7599", marginBottom: 8, fontSize: 14 }}>Operations Hub — SLIIT</p>

        <div style={{
          display: "inline-block", padding: "4px 12px", borderRadius: 100,
          background: "rgba(0,229,195,0.1)", border: "1px solid rgba(0,229,195,0.3)",
          color: "#00e5c3", fontSize: 11, fontWeight: 600, marginBottom: 28,
          letterSpacing: "0.06em", textTransform: "uppercase",
        }}>IT3030 · PAF 2026</div>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 10, padding: "10px 14px", marginBottom: 20,
            color: "#ef4444", fontSize: 13, fontWeight: 600,
          }}>
            {error === "server_error"  ? "⚠️ Server error. Please try again."
            : error === "oauth_failed" ? "⚠️ Google sign-in failed. Please try again."
            :                           "⚠️ Login failed. Please try again."}
          </div>
        )}

        <button
          onClick={handleLogin}
          style={{
            width: "100%", padding: "14px 20px", background: "white",
            border: "none", borderRadius: 12, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 12, fontSize: 15, fontWeight: 600, color: "#3c4043",
            transition: "all 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)";    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)"; }}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google" style={{ width: 22, height: 22 }}
          />
          Sign in with Google
        </button>

        <div style={{
          marginTop: 24, padding: "14px 16px",
          background: "rgba(255,255,255,0.03)", borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <p style={{ color: "#4b5563", fontSize: 11, margin: "0 0 8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Access Levels
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              { role: "Admin",   color: "#ef4444", desc: "Full system access"    },
              { role: "Staff",   color: "#00e5c3", desc: "Module management"     },
              { role: "Student", color: "#4f6fff", desc: "Bookings & incidents"  },
            ].map(r => (
              <div key={r.role} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  padding: "2px 8px", borderRadius: 100, fontSize: 10, fontWeight: 700,
                  background: `${r.color}18`, color: r.color,
                }}>{r.role}</span>
                <span style={{ color: "#4b5563", fontSize: 11 }}>{r.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: "#2d3360", fontSize: 11, marginTop: 20, lineHeight: 1.6 }}>
          Only authorized SLIIT members can access this system.
          <br />Your account is created automatically on first sign-in.
        </p>
      </div>
    </div>
  );
}