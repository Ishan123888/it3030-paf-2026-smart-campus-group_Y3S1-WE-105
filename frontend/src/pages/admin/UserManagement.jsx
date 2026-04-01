import { useEffect, useState } from "react";
import API from "../../api/api"; // ✅ FIX: api.js use කරනවා — token auto attach

/**
 * UserManagement — Member 4 (Admin Panel)
 *
 * ✅ FIX: axios directly use කරනවේ නෑ
 *         api.js interceptor token automatically attach කරනවා
 *
 * Role-based:
 *   ADMIN only — ProtectedRoute enforces this
 */
const ROLES = ["ROLE_USER", "ROLE_ADMIN", "ROLE_STAFF", "ROLE_TECHNICIAN"];

const roleColors = {
  ROLE_USER:       { bg: "rgba(79,111,255,0.12)",  color: "#4f6fff" },
  ROLE_ADMIN:      { bg: "rgba(239,68,68,0.12)",   color: "#ef4444" },
  ROLE_STAFF:      { bg: "rgba(0,229,195,0.12)",   color: "#00e5c3" },
  ROLE_TECHNICIAN: { bg: "rgba(245,166,35,0.12)",  color: "#f5a623" },
};

export default function UserManagement() {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState(null);
  const [message,  setMessage]  = useState("");

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get("/users"); // ✅ token auto attached
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setMessage("❌ Failed to load users. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id) => {
    setUpdating(id);
    try {
      await API.patch(`/users/${id}/toggle-active`); // ✅ token auto attached
      await loadUsers();
      showMessage("✅ User status updated!");
    } catch (err) {
      showMessage("❌ Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    setUpdating(id);
    try {
      await API.put(`/users/${id}/roles`, { roles: [newRole] }); // ✅ token auto attached
      setUsers(prev => prev.map(u =>
        u.id === id ? { ...u, roles: [newRole] } : u
      ));
      showMessage("✅ Role updated successfully!");
    } catch (err) {
      showMessage("❌ Failed to update role");
    } finally {
      setUpdating(null);
    }
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: "#060812",
      paddingTop: 80, fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ padding: "0 32px 60px", maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: "0 0 6px", color: "#e8ecff", fontSize: 28, fontWeight: 800 }}>
            👥 User Management
          </h1>
          <p style={{ color: "#6b7599", margin: 0, fontSize: 14 }}>
            Manage user roles and account status
          </p>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            padding: "12px 16px", borderRadius: 8, marginBottom: 20,
            background: message.includes("✅") ? "rgba(0,229,195,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${message.includes("✅") ? "rgba(0,229,195,0.3)" : "rgba(239,68,68,0.3)"}`,
            color: message.includes("✅") ? "#00e5c3" : "#ef4444",
            fontSize: 14, fontWeight: 600,
          }}>{message}</div>
        )}

        {/* Stats */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16, marginBottom: 28,
        }}>
          {ROLES.map(role => (
            <div key={role} style={{
              background: "rgba(13,17,32,0.9)",
              border: "1px solid rgba(99,130,255,0.15)",
              borderRadius: 12, padding: "16px 20px", textAlign: "center",
            }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: roleColors[role]?.color }}>
                {users.filter(u => u.roles?.includes(role)).length}
              </div>
              <div style={{ color: "#6b7599", fontSize: 12, marginTop: 2 }}>
                {role.replace("ROLE_", "")}s
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{
          background: "rgba(13,17,32,0.9)",
          border: "1px solid rgba(99,130,255,0.15)",
          borderRadius: 14, overflow: "hidden",
        }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: "center", color: "#6b7599" }}>
              <div style={{
                width: 32, height: 32, border: "3px solid #1e2a3a",
                borderTop: "3px solid #4f6fff", borderRadius: "50%",
                animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
              }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "#6b7599" }}>
              No users found
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                  {["User", "Email", "Roles", "Status", "Change Role", "Actions"].map(h => (
                    <th key={h} style={{
                      padding: "14px 16px", textAlign: "left",
                      fontSize: 11, fontWeight: 700, color: "#6b7599",
                      textTransform: "uppercase", letterSpacing: "0.06em",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={u.id} style={{
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                    opacity: updating === u.id ? 0.6 : 1,
                    transition: "opacity 0.2s",
                  }}>

                    {/* User */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <img
                          src={u.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "U")}&background=4f6fff&color=fff`}
                          alt={u.name}
                          style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
                        />
                        <span style={{ color: "#e8ecff", fontWeight: 600, fontSize: 14 }}>
                          {u.name}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: "14px 16px", color: "#6b7599", fontSize: 13 }}>
                      {u.email}
                    </td>

                    {/* Roles */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {(u.roles || ["ROLE_USER"]).map(r => (
                          <span key={r} style={{
                            padding: "3px 10px", borderRadius: 20,
                            fontSize: 10, fontWeight: 700,
                            background: roleColors[r]?.bg || "rgba(255,255,255,0.08)",
                            color: roleColors[r]?.color || "#e8ecff",
                          }}>
                            {r?.replace("ROLE_", "")}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: u.active ? "#00e5c3" : "#ef4444",
                      }}>
                        {u.active ? "● Active" : "● Inactive"}
                      </span>
                    </td>

                    {/* Change Role */}
                    <td style={{ padding: "14px 16px" }}>
                      <select
                        value={(u.roles && u.roles[0]) || "ROLE_USER"}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        disabled={updating === u.id}
                        style={{
                          padding: "7px 12px", borderRadius: 8,
                          border: "1px solid rgba(99,130,255,0.3)",
                          background: "#0d1120", color: "#e8ecff",
                          fontSize: 12, cursor: "pointer", outline: "none",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {ROLES.map(role => (
                          <option key={role} value={role} style={{ background: "#0d1120" }}>
                            {role.replace("ROLE_", "")}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Toggle Active */}
                    <td style={{ padding: "14px 16px" }}>
                      <button
                        onClick={() => toggleStatus(u.id)}
                        disabled={updating === u.id}
                        style={{
                          padding: "7px 14px", borderRadius: 8, border: "none",
                          cursor: updating === u.id ? "not-allowed" : "pointer",
                          fontSize: 12, fontWeight: 700,
                          fontFamily: "'DM Sans', sans-serif",
                          background: u.active ? "rgba(239,68,68,0.1)" : "rgba(0,229,195,0.1)",
                          color: u.active ? "#ef4444" : "#00e5c3",
                          transition: "all 0.2s",
                        }}
                      >
                        {u.active ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}