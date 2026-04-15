import { useCallback, useEffect, useState } from "react";
import API from "../../api/api";
import AdminLayout from "../../components/admin/AdminLayout";
import { IconUsers, IconUserCheck } from "../../components/common/Icons";

const ROLES = ["ROLE_USER", "ROLE_ADMIN", "ROLE_STAFF", "ROLE_TECHNICIAN"];

const roleColors = {
  ROLE_USER:       { bg:"#eff6ff", color:"#2563eb", border:"#bfdbfe" },
  ROLE_ADMIN:      { bg:"#fef2f2", color:"#dc2626", border:"#fecaca" },
  ROLE_STAFF:      { bg:"#f0fdf4", color:"#059669", border:"#bbf7d0" },
  ROLE_TECHNICIAN: { bg:"#fffbeb", color:"#d97706", border:"#fde68a" },
};

export default function UserManagement() {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState(null);
  const [message,  setMessage]  = useState("");

  const showMessage = useCallback((msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      showMessage("❌ Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (id, newRole) => {
    setUpdating(id);
    try {
      await API.put(`/users/${id}/roles`, { roles: [newRole] });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, roles: [newRole] } : u));
      showMessage("✅ Role updated successfully!");
    } catch {
      showMessage("❌ Failed to update role");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <AdminLayout title="User Management">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin:"0 0 4px", color:"#0f172a", fontSize:20, fontWeight:800 }}>Users & Permissions</h2>
        <p style={{ color:"#64748b", margin:0, fontSize:14 }}>Manage user roles and access permissions</p>
      </div>

      {/* Message */}
      {message && (
        <div style={{ padding:"12px 16px", borderRadius:10, marginBottom:20, background: message.includes("✅")?"#f0fdf4":"#fef2f2", border:`1px solid ${message.includes("✅")?"#bbf7d0":"#fecaca"}`, color: message.includes("✅")?"#15803d":"#dc2626", fontSize:14, fontWeight:600 }}>
          {message}
        </div>
      )}

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        {ROLES.map(role => (
          <div key={role} style={{ background: roleColors[role].bg, border:`1px solid ${roleColors[role].border}`, borderRadius:12, padding:"16px 20px", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:`${roleColors[role].color}18`, display:"flex", alignItems:"center", justifyContent:"center", color:roleColors[role].color, flexShrink:0 }}>
              {role === 'ROLE_ADMIN' ? <IconUserCheck size={20}/> : <IconUsers size={20}/>}
            </div>
            <div>
              <div style={{ fontSize:24, fontWeight:800, color:roleColors[role].color, lineHeight:1 }}>
                {users.filter(u => u.roles?.includes(role)).length}
              </div>
              <div style={{ color:"#64748b", fontSize:11, marginTop:2, fontWeight:600 }}>
                {role.replace("ROLE_", "")}s
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:"#ffffff", border:"1px solid #e2e8f0", borderRadius:14, overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
        {loading ? (
          <div style={{ padding:48, textAlign:"center", color:"#64748b" }}>
            <div style={{ width:32, height:32, border:"3px solid #e2e8f0", borderTop:"3px solid #4f6fff", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding:48, textAlign:"center", color:"#64748b" }}>No users found</div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#f8fafc", borderBottom:"2px solid #e2e8f0" }}>
                {["User", "Email", "Current Roles", "Change Role"].map(h => (
                  <th key={h} style={{ padding:"14px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={u.id} style={{ borderBottom:"1px solid #f1f5f9", background: idx%2===0?"#ffffff":"#fafafa", opacity: updating===u.id?0.6:1, transition:"opacity 0.2s" }}>
                  {/* User */}
                  <td style={{ padding:"14px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <img
                        src={u.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name||"U")}&background=4f6fff&color=fff`}
                        alt={u.name}
                        style={{ width:38, height:38, borderRadius:"50%", objectFit:"cover", border:"2px solid #e2e8f0" }}
                      />
                      <div>
                        <div style={{ color:"#0f172a", fontWeight:600, fontSize:14 }}>{u.name}</div>
                        <div style={{ color: u.active?"#059669":"#dc2626", fontSize:11, fontWeight:600, marginTop:1 }}>
                          {u.active ? "● Active" : "● Inactive"}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ padding:"14px 16px", color:"#475569", fontSize:13 }}>{u.email}</td>

                  {/* Roles */}
                  <td style={{ padding:"14px 16px" }}>
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                      {(u.roles || ["ROLE_USER"]).map(r => (
                        <span key={r} style={{ padding:"4px 10px", borderRadius:20, fontSize:10, fontWeight:700, background: roleColors[r]?.bg||"#f1f5f9", color: roleColors[r]?.color||"#475569", border:`1px solid ${roleColors[r]?.border||"#e2e8f0"}` }}>
                          {r?.replace("ROLE_", "")}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Change Role */}
                  <td style={{ padding:"14px 16px" }}>
                    <select
                      value={(u.roles && u.roles[0]) || "ROLE_USER"}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      disabled={updating === u.id}
                      style={{ padding:"8px 12px", borderRadius:8, border:"2px solid #e2e8f0", background:"#f8fafc", color:"#0f172a", fontSize:13, cursor:"pointer", outline:"none", fontFamily:"inherit", fontWeight:600 }}
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
    </AdminLayout>
  );
}
