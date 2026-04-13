import { useEffect, useState } from "react";
import { getAllUsers, updateUserRole } from "../api/api";
import { useNavigate } from "react-router-dom";
import BackgroundSlideshow, { toImgurDirect } from "../components/common/BackgroundSlideshow";

const DASH_BG = [toImgurDirect("https://imgur.com/t4yWwhI")];

const ROLES = ["ROLE_USER", "ROLE_ADMIN", "ROLE_TECHNICIAN"];

const roleColors = {
  ROLE_USER:       { bg: "#e8f5e9", color: "#2e7d32" },
  ROLE_ADMIN:      { bg: "#fce4ec", color: "#c62828" },
  ROLE_TECHNICIAN: { bg: "#e3f2fd", color: "#1565c0" },
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const res = await getAllUsers(); // returns axios response
      setUsers(res.data);             // ✅ use res.data
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    setUpdating(id);
    try {
      await updateUserRole(id, newRole);
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
      setMessage("✅ Role updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to update role");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <BackgroundSlideshow slides={DASH_BG} className="min-h-screen pt-16">
      <div style={{ minHeight: "100vh", backgroundColor: "transparent", paddingTop: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ padding: "32px", maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: "0 0 8px 0", color: "#e8ecff", fontSize: 28, fontWeight: 800 }}>
            👥 User Management
          </h1>
          <p style={{ color: "#6b7599", margin: 0 }}>Manage user roles and permissions</p>
          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => navigate("/admin/incidents")}
              style={{
                border: "1px solid rgba(79,111,255,0.35)",
                background: "rgba(79,111,255,0.12)",
                color: "#cdd7ff",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Open Incident Management
            </button>
          </div>
        </div>

        {message && (
          <div style={{
            padding: "12px 16px", borderRadius: 8, marginBottom: 16,
            backgroundColor: message.includes("✅") ? "#e8f5e9" : "#fce4ec",
            color: message.includes("✅") ? "#2e7d32" : "#c62828"
          }}>{message}</div>
        )}

        {/* Role count cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          {ROLES.map(role => (
            <div key={role} className="card-3d" style={{
              background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 14, padding: 16, textAlign: "center",
              backdropFilter: "blur(14px)",
              boxShadow: "0 18px 60px rgba(0,0,0,0.22)"
            }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: roleColors[role]?.color }}>
                {users.filter(u => (u.roles?.includes(role) || u.role === role)).length}
              </div>
              <div style={{ color: "#6b7599", fontSize: 13 }}>{role.replace("ROLE_", "")}s</div>
            </div>
          ))}
        </div>

        <div className="card-3d" style={{
          background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 16, overflow: "hidden",
          backdropFilter: "blur(14px)",
          boxShadow: "0 18px 70px rgba(0,0,0,0.26)"
        }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#6b7599" }}>Loading users...</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                  {["User", "Email", "Roles", "Change Role"].map(h => (
                    <th key={h} style={{ padding: "14px 16px", textAlign: "left",
                      fontSize: 12, fontWeight: 700, color: "#6b7599",
                      textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={u.id} style={{
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.03)"
                  }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <img src={u.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=4f6fff&color=fff`}
                          alt={u.name} style={{ width: 36, height: 36, borderRadius: "50%" }} />
                        <span style={{ color: "#e8ecff", fontWeight: 500 }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#6b7599", fontSize: 14 }}>{u.email}</td>
                    <td style={{ padding: "14px 16px" }}>
                      {(u.roles || [u.role]).map(r => r && (
                        <span key={r} style={{
                          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                          marginRight: 4, display: "inline-block",
                          backgroundColor: roleColors[r]?.bg || "#f5f5f5",
                          color: roleColors[r]?.color || "#333"
                        }}>{r?.replace("ROLE_", "")}</span>
                      ))}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <select
                        value={u.role || (u.roles && u.roles[0]) || "ROLE_USER"}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        disabled={updating === u.id}
                        style={{
                          padding: "6px 12px", borderRadius: 6,
                          border: "1px solid rgba(255,255,255,0.18)",
                          cursor: "pointer", fontSize: 13,
                          backgroundColor: "rgba(0,0,0,0.35)", color: "#e8ecff"
                        }}
                      >
                        {ROLES.map(role => (
                          <option key={role} value={role}>{role.replace("ROLE_", "")}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      </div>
    </BackgroundSlideshow>
  );
}
