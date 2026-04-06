import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import api from "../api/api";

export default function Login() {
  const { user, loading, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");

  // "login" or "register" mode
  const [mode, setMode] = useState("login");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");

  // UI state
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Already logged in -> redirect
  useEffect(() => {
    if (location.pathname === "/oauth-callback") return;
    if (!loading && user) {
      if (user.roles?.includes("ROLE_ADMIN")) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, loading, navigate, location]);

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8081/oauth2/authorization/google";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSubmitting(true);

    try {
      if (mode === "register") {
        // Register flow
        await api.post("/auth/register", { name, email, password, role });
        setFormSuccess("Registered successfully! Please login.");
        setMode("login");
        setName("");
        setPassword("");
      } else {
        // Login flow -> get token -> set auth
        const res = await api.post("/auth/login", { email, password });
        await loginWithToken(res.data.token);
        // useEffect above handles redirect after user state updates
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Something went wrong. Please try again.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
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
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .input-field {
          width: 100%; padding: 12px 14px; box-sizing: border-box;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(99,130,255,0.2);
          border-radius: 10px; color: #e8ecff; font-size: 14px;
          outline: none; transition: border 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .input-field:focus { border-color: rgba(79,111,255,0.6); }
        .input-field::placeholder { color: #3d4466; }
        .tab-btn { 
          flex: 1; padding: 10px; border: none; cursor: pointer;
          font-size: 13px; font-weight: 700; border-radius: 8px;
          transition: all 0.2s; font-family: 'DM Sans', sans-serif;
        }
        .tab-btn.active {
          background: rgba(79,111,255,0.2);
          color: #4f6fff; border: 1px solid rgba(79,111,255,0.4);
        }
        .tab-btn.inactive {
          background: transparent; color: #4b5563; border: 1px solid transparent;
        }
        .submit-btn {
          width: 100%; padding: 13px; border: none; border-radius: 12px;
          background: linear-gradient(135deg, #4f6fff, #7b6fff);
          color: white; font-size: 15px; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 16px rgba(79,111,255,0.3);
        }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(79,111,255,0.4); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .google-btn {
          width: 100%; padding: 13px 20px; background: white;
          border: none; border-radius: 12px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          gap: 12px; font-size: 14px; font-weight: 600; color: #3c4043;
          transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          font-family: 'DM Sans', sans-serif;
        }
        .google-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
        select.input-field option { background: #0d1120; color: #e8ecff; }
      `}</style>

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

      {/* Card */}
      <div style={{
        background: "rgba(13,17,32,0.9)",
        border: "1px solid rgba(99,130,255,0.2)",
        borderRadius: 24, padding: "40px 36px",
        width: "100%", maxWidth: 420,
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        textAlign: "center", position: "relative", zIndex: 1,
        backdropFilter: "blur(12px)",
      }}>

        {/* Logo */}
        <div style={{
          width: 60, height: 60, borderRadius: 16, margin: "0 auto 16px",
          background: "linear-gradient(135deg, #4f6fff, #7b6fff)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, boxShadow: "0 0 32px rgba(79,111,255,0.4)",
        }}>🎓</div>

        <h1 style={{ color: "#e8ecff", margin: "0 0 4px", fontSize: 26, fontWeight: 800, letterSpacing: -1 }}>
          Smart<span style={{ color: "#4f6fff" }}>Campus</span>
        </h1>
        <p style={{ color: "#6b7599", marginBottom: 6, fontSize: 13 }}>Operations Hub – SLIIT</p>
        <div style={{
          display: "inline-block", padding: "3px 10px", borderRadius: 100,
          background: "rgba(0,229,195,0.1)", border: "1px solid rgba(0,229,195,0.3)",
          color: "#00e5c3", fontSize: 10, fontWeight: 600, marginBottom: 24,
          letterSpacing: "0.06em", textTransform: "uppercase",
        }}>IT3030 · PAF 2026</div>

        {/* OAuth error banner */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 10, padding: "10px 14px", marginBottom: 16,
            color: "#ef4444", fontSize: 13, fontWeight: 600,
          }}>
            {error === "server_error"  ? "⚠️ Server error. Please try again."
            : error === "oauth_failed" ? "⚠️ Google sign-in failed. Please try again."
            :                            "⚠️ Login failed. Please try again."}
          </div>
        )}

        {/* Form error */}
        {formError && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 10, padding: "10px 14px", marginBottom: 16,
            color: "#ef4444", fontSize: 13, fontWeight: 600,
          }}>⚠️ {formError}</div>
        )}

        {/* Form success */}
        {formSuccess && (
          <div style={{
            background: "rgba(0,229,195,0.1)", border: "1px solid rgba(0,229,195,0.3)",
            borderRadius: 10, padding: "10px 14px", marginBottom: 16,
            color: "#00e5c3", fontSize: 13, fontWeight: 600,
          }}>✅ {formSuccess}</div>
        )}

        {/* Login / Register tabs */}
        <div style={{
          display: "flex", gap: 6, marginBottom: 20,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 10, padding: 4,
        }}>
          <button
            className={`tab-btn ${mode === "login" ? "active" : "inactive"}`}
            onClick={() => { setMode("login"); setFormError(""); setFormSuccess(""); }}
          >Login</button>
          <button
            className={`tab-btn ${mode === "register" ? "active" : "inactive"}`}
            onClick={() => { setMode("register"); setFormError(""); setFormSuccess(""); }}
          >Register</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>

          {/* Name field - register only */}
          {mode === "register" && (
            <div>
              <label style={{ color: "#6b7599", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
                Full Name
              </label>
              <input
                className="input-field"
                type="text"
                placeholder="e.g. Ishan Perera"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label style={{ color: "#6b7599", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
              Email
            </label>
            <input
              className="input-field"
              type="email"
              placeholder="your@sliit.lk"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ color: "#6b7599", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                className="input-field"
                type={showPassword ? "text" : "password"}
                placeholder={mode === "register" ? "Min. 6 characters" : "Enter password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ paddingRight: 40 }}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  cursor: "pointer", color: "#4b5563", fontSize: 16, userSelect: "none",
                }}
              >{showPassword ? "🙈" : "👁️"}</span>
            </div>
          </div>

          {/* Role selector - register only */}
          {mode === "register" && (
            <div>
              <label style={{ color: "#6b7599", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
                Role
              </label>
              <select
                className="input-field"
                value={role}
                onChange={e => setRole(e.target.value)}
              >
                <option value="STUDENT">Student</option>
                <option value="STAFF">Staff</option>
              </select>
              <p style={{ color: "#3d4466", fontSize: 11, margin: "6px 0 0" }}>
                Admin accounts are managed separately.
              </p>
            </div>
          )}

          {/* Submit */}
          <button className="submit-btn" type="submit" disabled={submitting} style={{ marginTop: 4 }}>
            {submitting
              ? (mode === "register" ? "Registering..." : "Logging in...")
              : (mode === "register" ? "Create Account" : "Login")}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
          <span style={{ color: "#3d4466", fontSize: 12, fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* Google Login */}
        <button className="google-btn" onClick={handleGoogleLogin}>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google" style={{ width: 20, height: 20 }}
          />
          Continue with Google
        </button>

        {/* Access levels info */}
        <div style={{
          marginTop: 20, padding: "12px 14px",
          background: "rgba(255,255,255,0.03)",
          borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <p style={{ color: "#4b5563", fontSize: 11, margin: "0 0 8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Access Levels
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              { role: "Admin",   color: "#ef4444", desc: "Full system access"   },
              { role: "Staff",   color: "#00e5c3", desc: "Module management"    },
              { role: "Student", color: "#4f6fff", desc: "Bookings & incidents" },
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

        <p style={{ color: "#2d3360", fontSize: 11, marginTop: 16, lineHeight: 1.6 }}>
          Only authorized SLIIT members can access this system.
        </p>
      </div>
    </div>
  );
}