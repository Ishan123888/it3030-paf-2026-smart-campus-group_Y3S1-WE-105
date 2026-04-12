import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import BackgroundSlideshow, { toImgurDirect } from "../components/common/BackgroundSlideshow";
import {
  addIncidentComment,
  assignIncident,
  createIncident,
  deleteIncidentComment,
  getIncidentAssignees,
  getIncidents,
  updateIncidentComment,
  updateIncidentStatus,
} from "../api/api";
import { useAuth } from "../context/AuthContext";

const DASH_BG = [toImgurDirect("https://imgur.com/t4yWwhI")];
const CATEGORIES = ["FACILITY", "EQUIPMENT", "IT", "SAFETY", "CLEANING", "OTHER"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const STATUS_COLORS = {
  OPEN: "#3b82f6",
  IN_PROGRESS: "#f59e0b",
  RESOLVED: "#10b981",
  CLOSED: "#9ca3af",
  REJECTED: "#ef4444",
};

export default function Incidents() {
  const { user, isAdmin, isStaff } = useAuth();
  const location = useLocation();
  const canAssign = isAdmin() || isStaff();
  const isAdminManagementView = location.pathname.startsWith("/admin/incidents");
  const canCreateIncident = !isAdminManagementView;

  const [tickets, setTickets] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [assignees, setAssignees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    category: "FACILITY",
    description: "",
    priority: "MEDIUM",
    location: "",
    resourceId: "",
    resourceName: "",
    preferredContactName: user?.name || "",
    preferredContactEmail: user?.email || "",
    preferredContactPhone: "",
  });
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (!user) return;
    loadTickets();
    if (canAssign) loadAssignees();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      preferredContactName: prev.preferredContactName || user.name || "",
      preferredContactEmail: prev.preferredContactEmail || user.email || "",
    }));
  }, [user]);

  const filteredTickets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const statusPass = statusFilter === "ALL" || ticket.status === statusFilter;
      if (!statusPass) return false;
      if (!normalizedSearch) return true;

      const searchable = [
        ticket.ticketNumber,
        ticket.location,
        ticket.createdByName,
        ticket.createdByEmail,
        ticket.category,
        ticket.priority,
        ticket.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });
  }, [tickets, statusFilter, searchTerm]);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedId) || null,
    [tickets, selectedId]
  );

  const setFlash = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3200);
  };

  const ticketStats = useMemo(() => {
    const base = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0, REJECTED: 0 };
    tickets.forEach((ticket) => {
      if (base[ticket.status] !== undefined) base[ticket.status] += 1;
    });
    return base;
  }, [tickets]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await getIncidents();
      setTickets(res.data || []);
      const ids = new Set((res.data || []).map((ticket) => ticket.id));
      if ((res.data || []).length > 0 && (!selectedId || !ids.has(selectedId))) {
        setSelectedId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
      setFlash("Failed to load incidents");
    } finally {
      setLoading(false);
    }
  };

  const loadAssignees = async () => {
    try {
      const res = await getIncidentAssignees();
      setAssignees(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (files.length > 3) {
      setFlash("Only 3 images allowed");
      return;
    }

    setCreating(true);
    try {
      const res = await createIncident(form, files);
      setTickets((prev) => [res.data, ...prev]);
      setSelectedId(res.data.id);
      setForm({
        category: "FACILITY",
        description: "",
        priority: "MEDIUM",
        location: "",
        resourceId: "",
        resourceName: "",
        preferredContactName: user?.name || "",
        preferredContactEmail: user?.email || "",
        preferredContactPhone: "",
      });
      setFiles([]);
      setFlash("Incident created successfully");
    } catch (err) {
      setFlash(err.response?.data?.message || "Failed to create incident");
    } finally {
      setCreating(false);
    }
  };

  const onAssign = async (ticketId, assigneeEmail) => {
    if (!assigneeEmail) return;
    setSaving(true);
    try {
      const res = await assignIncident(ticketId, assigneeEmail);
      upsertTicket(res.data);
      setFlash("Ticket assigned");
    } catch (err) {
      setFlash(err.response?.data?.message || "Failed to assign ticket");
    } finally {
      setSaving(false);
    }
  };

  const onStatusChange = async (ticketId, status) => {
    const payload = { status };
    if (status === "RESOLVED") {
      const notes = window.prompt("Add resolution notes:");
      if (!notes) return;
      payload.resolutionNotes = notes;
    }
    if (status === "REJECTED") {
      const reason = window.prompt("Provide rejection reason:");
      if (!reason) return;
      payload.rejectionReason = reason;
    }

    setSaving(true);
    try {
      const res = await updateIncidentStatus(ticketId, payload);
      upsertTicket(res.data);
      setFlash(`Status updated to ${status}`);
    } catch (err) {
      setFlash(err.response?.data?.message || "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  const submitComment = async () => {
    if (!selectedTicket || !commentDraft.trim()) return;
    setSaving(true);
    try {
      const res = await addIncidentComment(selectedTicket.id, commentDraft.trim());
      upsertTicket(res.data);
      setCommentDraft("");
    } catch (err) {
      setFlash(err.response?.data?.message || "Failed to add comment");
    } finally {
      setSaving(false);
    }
  };

  const saveEditedComment = async () => {
    if (!selectedTicket || !editingComment || !editDraft.trim()) return;
    setSaving(true);
    try {
      const res = await updateIncidentComment(selectedTicket.id, editingComment, editDraft.trim());
      upsertTicket(res.data);
      setEditingComment(null);
      setEditDraft("");
    } catch (err) {
      setFlash(err.response?.data?.message || "Failed to update comment");
    } finally {
      setSaving(false);
    }
  };

  const removeComment = async (commentId) => {
    if (!selectedTicket) return;
    setSaving(true);
    try {
      await deleteIncidentComment(selectedTicket.id, commentId);
      await loadTickets();
    } catch (err) {
      setFlash(err.response?.data?.message || "Failed to delete comment");
    } finally {
      setSaving(false);
    }
  };

  const upsertTicket = (ticket) => {
    setTickets((prev) => {
      const index = prev.findIndex((existing) => existing.id === ticket.id);
      if (index === -1) return [ticket, ...prev];
      return prev.map((existing) => (existing.id === ticket.id ? ticket : existing));
    });
  };

  const canTransition = (ticket, target) => {
    const mine = ticket.createdByEmail === user?.email;
    const assigned = ticket.assignedToEmail === user?.email;
    const privileged = isAdmin() || isStaff();
    if (target === "REJECTED") return isAdmin();
    if (target === "IN_PROGRESS") return privileged || assigned;
    if (target === "RESOLVED") return privileged || assigned;
    if (target === "CLOSED") return privileged || mine;
    return false;
  };

  const canEditComment = (comment) => comment.createdByEmail === user?.email || isAdmin();

  return (
    <BackgroundSlideshow slides={DASH_BG} className="min-h-screen pt-16">
      <div style={styles.wrapper}>
        <div style={styles.grid}>
          <section className="card-3d" style={styles.leftPane}>
            <div style={styles.sectionTitleRow}>
              <h2 style={styles.sectionTitle}>
                {canCreateIncident ? "Report Incident" : "Incident Management"}
              </h2>
            </div>
            {message && <div style={styles.message}>{message}</div>}
            {canCreateIncident ? (
              <form onSubmit={handleCreate} style={{ display: "grid", gap: 10 }}>
                <div style={styles.row}>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={styles.input}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={styles.input}>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location *" style={styles.input} required />
                <div style={styles.row}>
                  <input value={form.resourceName} onChange={(e) => setForm({ ...form, resourceName: e.target.value })} placeholder="Resource Name" style={styles.input} />
                  <input value={form.resourceId} onChange={(e) => setForm({ ...form, resourceId: e.target.value })} placeholder="Resource ID" style={styles.input} />
                </div>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the incident *" rows={4} style={styles.input} required />
                <div style={styles.row}>
                  <input value={form.preferredContactName} onChange={(e) => setForm({ ...form, preferredContactName: e.target.value })} placeholder="Contact Name *" style={styles.input} required />
                  <input value={form.preferredContactEmail} onChange={(e) => setForm({ ...form, preferredContactEmail: e.target.value })} placeholder="Contact Email *" type="email" style={styles.input} required />
                </div>
                <input value={form.preferredContactPhone} onChange={(e) => setForm({ ...form, preferredContactPhone: e.target.value })} placeholder="Contact Phone *" style={styles.input} required />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 3))}
                  style={styles.input}
                />
                <small style={styles.muted}>Max 3 images. Uploaded via ImageKit.</small>
                <button type="submit" disabled={creating} style={styles.primaryBtn}>
                  {creating ? "Creating..." : "Create Ticket"}
                </button>
              </form>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                <p style={styles.helperText}>
                  This is the admin management view. Ticket reporting stays in the user dashboard.
                </p>
                <div style={styles.statsGrid}>
                  {Object.entries(ticketStats).map(([status, count]) => (
                    <div key={status} style={styles.statCard}>
                      <div style={{ ...styles.statValue, color: STATUS_COLORS[status] }}>{count}</div>
                      <div style={styles.statLabel}>{status.replace("_", " ")}</div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={loadTickets} style={styles.primaryBtn} disabled={loading}>
                  {loading ? "Refreshing..." : "Refresh Tickets"}
                </button>
                <p style={styles.muted}>
                  Use the right panel to assign technicians, update status, reject with reason, and audit actions.
                </p>
              </div>
            )}
          </section>

          <section className="card-3d" style={styles.middlePane}>
            <div style={styles.sectionTitleRow}>
              <h2 style={styles.sectionTitle}>Tickets</h2>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...styles.input, maxWidth: 170 }}>
                {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ticket no, reporter, location..."
              style={{ ...styles.input, marginBottom: 10 }}
            />

            {loading ? (
              <p style={styles.muted}>Loading incidents...</p>
            ) : filteredTickets.length === 0 ? (
              <p style={styles.muted}>No tickets found.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {filteredTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedId(ticket.id)}
                    style={{
                      ...styles.ticketCard,
                      border: ticket.id === selectedId ? "1px solid rgba(0,229,195,.55)" : "1px solid rgba(255,255,255,.1)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <strong style={{ color: "#e8ecff", textAlign: "left" }}>{ticket.ticketNumber}</strong>
                      <span style={{ ...styles.badge, color: STATUS_COLORS[ticket.status], borderColor: `${STATUS_COLORS[ticket.status]}66` }}>
                        {ticket.status}
                      </span>
                    </div>
                    <p style={{ margin: "8px 0 4px", color: "rgba(255,255,255,.7)", textAlign: "left" }}>
                      {ticket.category} • {ticket.priority}
                    </p>
                    <p style={{ ...styles.textClampOne, margin: 0, color: "#6b7599", fontSize: 12, textAlign: "left" }}>{ticket.location}</p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="card-3d" style={styles.rightPane}>
            {!selectedTicket ? (
              <p style={styles.muted}>Select a ticket to view details.</p>
            ) : (
              <>
                <div style={styles.sectionTitleRow}>
                  <h2 style={styles.sectionTitle}>{selectedTicket.ticketNumber}</h2>
                  <span style={{ ...styles.badge, color: STATUS_COLORS[selectedTicket.status], borderColor: `${STATUS_COLORS[selectedTicket.status]}66` }}>
                    {selectedTicket.status}
                  </span>
                </div>
                <p style={styles.description}>{selectedTicket.description}</p>
                <p style={styles.meta}>Category: {selectedTicket.category}</p>
                <p style={styles.meta}>Priority: {selectedTicket.priority}</p>
                <p style={styles.meta}>Location: {selectedTicket.location}</p>
                <p style={styles.meta}>Reporter: {selectedTicket.createdByName} ({selectedTicket.createdByEmail})</p>
                <p style={styles.meta}>Assignee: {selectedTicket.assignedToName || "Not assigned"}</p>
                {selectedTicket.resolutionNotes && <p style={styles.meta}>Resolution: {selectedTicket.resolutionNotes}</p>}
                {selectedTicket.rejectionReason && <p style={{ ...styles.meta, color: "#ef4444" }}>Rejection: {selectedTicket.rejectionReason}</p>}

                {selectedTicket.attachments?.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(90px,1fr))", gap: 8, marginBottom: 14 }}>
                    {selectedTicket.attachments.map((att) => (
                      <a key={att.fileId || att.url} href={att.url} target="_blank" rel="noreferrer">
                        <img src={att.url} alt={att.fileName} style={styles.thumb} />
                      </a>
                    ))}
                  </div>
                )}

                {canAssign && (
                  <div style={styles.row}>
                    <select
                      onChange={(e) => onAssign(selectedTicket.id, e.target.value)}
                      defaultValue=""
                      style={styles.input}
                      disabled={saving}
                    >
                      <option value="" disabled>Assign technician/staff</option>
                      {assignees.map((person) => (
                        <option key={person.email} value={person.email}>{person.name} ({person.email})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                  {selectedTicket.status === "OPEN" && canTransition(selectedTicket, "IN_PROGRESS") && (
                    <button style={styles.actionBtn} onClick={() => onStatusChange(selectedTicket.id, "IN_PROGRESS")} disabled={saving}>Start</button>
                  )}
                  {selectedTicket.status === "IN_PROGRESS" && canTransition(selectedTicket, "RESOLVED") && (
                    <button style={styles.actionBtn} onClick={() => onStatusChange(selectedTicket.id, "RESOLVED")} disabled={saving}>Resolve</button>
                  )}
                  {selectedTicket.status === "RESOLVED" && canTransition(selectedTicket, "CLOSED") && (
                    <button style={styles.actionBtn} onClick={() => onStatusChange(selectedTicket.id, "CLOSED")} disabled={saving}>Close</button>
                  )}
                  {(selectedTicket.status === "OPEN" || selectedTicket.status === "IN_PROGRESS") && canTransition(selectedTicket, "REJECTED") && (
                    <button style={{ ...styles.actionBtn, color: "#ef4444", borderColor: "rgba(239,68,68,.4)" }} onClick={() => onStatusChange(selectedTicket.id, "REJECTED")} disabled={saving}>
                      Reject
                    </button>
                  )}
                </div>

                <h4 style={{ margin: "8px 0", color: "#e8ecff" }}>Comments</h4>
                <div style={{ display: "grid", gap: 8, maxHeight: 240, overflowY: "auto", marginBottom: 8 }}>
                  {(selectedTicket.comments || []).map((comment) => (
                    <div key={comment.id} style={styles.commentCard}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <strong style={{ color: "#e8ecff", fontSize: 12 }}>{comment.createdByName}</strong>
                        <span style={styles.mutedSmall}>{new Date(comment.updatedAt || comment.createdAt).toLocaleString()}</span>
                      </div>
                      {editingComment === comment.id ? (
                        <>
                          <textarea value={editDraft} onChange={(e) => setEditDraft(e.target.value)} rows={3} style={{ ...styles.input, marginTop: 6 }} />
                          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                            <button style={styles.actionBtn} onClick={saveEditedComment}>Save</button>
                            <button style={styles.actionBtn} onClick={() => { setEditingComment(null); setEditDraft(""); }}>Cancel</button>
                          </div>
                        </>
                      ) : (
                        <p style={{ ...styles.wrapText, margin: "6px 0", color: "rgba(255,255,255,.8)", fontSize: 13 }}>{comment.content}</p>
                      )}

                      {canEditComment(comment) && editingComment !== comment.id && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            style={styles.commentAction}
                            onClick={() => {
                              setEditingComment(comment.id);
                              setEditDraft(comment.content);
                            }}
                          >
                            Edit
                          </button>
                          <button style={styles.commentAction} onClick={() => removeComment(comment.id)}>Delete</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div style={styles.row}>
                  <textarea
                    rows={2}
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    placeholder="Add a comment..."
                    style={styles.input}
                  />
                  <button style={styles.primaryBtn} onClick={submitComment} disabled={saving || !commentDraft.trim()}>
                    Add
                  </button>
                </div>

                {isAdminManagementView && (selectedTicket.auditLogs || []).length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <h4 style={{ margin: "8px 0", color: "#e8ecff" }}>Audit Trail</h4>
                    <div style={{ display: "grid", gap: 6, maxHeight: 160, overflowY: "auto" }}>
                      {selectedTicket.auditLogs.slice().reverse().slice(0, 8).map((log) => (
                        <div key={log.id} style={styles.auditItem}>
                          <strong style={{ color: "#cdd7ff", fontSize: 11 }}>{log.action}</strong>
                          <p style={{ ...styles.wrapText, margin: "2px 0", color: "#9ba7d1", fontSize: 11 }}>{log.details}</p>
                          <span style={styles.mutedSmall}>{log.actorName} • {new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </BackgroundSlideshow>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    padding: "20px 20px 40px",
    fontFamily: "'DM Sans', sans-serif",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 16,
    maxWidth: 1400,
    margin: "0 auto",
  },
  leftPane: {
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 16,
    backdropFilter: "blur(14px)",
  },
  middlePane: {
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 16,
    backdropFilter: "blur(14px)",
  },
  rightPane: {
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 16,
    backdropFilter: "blur(14px)",
    minHeight: 520,
  },
  sectionTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    margin: 0,
    color: "#e8ecff",
    fontSize: 18,
    fontWeight: 800,
  },
  input: {
    width: "100%",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,.16)",
    background: "rgba(0,0,0,.25)",
    color: "#e8ecff",
    padding: "10px 12px",
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    minWidth: 0,
  },
  row: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  primaryBtn: {
    border: "none",
    borderRadius: 10,
    padding: "10px 16px",
    background: "linear-gradient(135deg,#4f6fff,#00e5c3)",
    color: "#060812",
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
  actionBtn: {
    border: "1px solid rgba(79,111,255,.45)",
    borderRadius: 8,
    padding: "6px 10px",
    background: "rgba(0,0,0,.25)",
    color: "#4f6fff",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
  },
  ticketCard: {
    background: "rgba(255,255,255,0.02)",
    borderRadius: 12,
    padding: 12,
    cursor: "pointer",
    textAlign: "left",
  },
  badge: {
    fontSize: 11,
    border: "1px solid",
    borderRadius: 999,
    padding: "3px 8px",
    fontWeight: 700,
  },
  muted: {
    margin: 0,
    color: "#6b7599",
    fontSize: 13,
  },
  mutedSmall: {
    color: "#6b7599",
    fontSize: 11,
  },
  message: {
    marginBottom: 10,
    padding: "8px 10px",
    background: "rgba(79,111,255,.16)",
    border: "1px solid rgba(79,111,255,.35)",
    borderRadius: 8,
    color: "#cdd7ff",
    fontSize: 12,
  },
  description: {
    color: "rgba(255,255,255,.86)",
    fontSize: 14,
    marginTop: 0,
    marginBottom: 10,
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },
  meta: {
    color: "#9ba7d1",
    fontSize: 12,
    margin: "3px 0",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },
  thumb: {
    width: "100%",
    aspectRatio: "1 / 1",
    objectFit: "cover",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,.1)",
  },
  commentCard: {
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 10,
    padding: 8,
    background: "rgba(0,0,0,.22)",
    minWidth: 0,
  },
  commentAction: {
    border: "none",
    borderRadius: 6,
    padding: "4px 8px",
    background: "rgba(79,111,255,.15)",
    color: "#9eb3ff",
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 700,
  },
  helperText: {
    margin: 0,
    color: "#9ba7d1",
    fontSize: 13,
    lineHeight: 1.5,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 8,
  },
  statCard: {
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,.12)",
    padding: "10px 12px",
    background: "rgba(255,255,255,.02)",
  },
  statValue: {
    fontSize: 22,
    fontWeight: 800,
    lineHeight: 1.1,
  },
  statLabel: {
    color: "#9ba7d1",
    fontSize: 11,
    marginTop: 4,
    fontWeight: 700,
  },
  textClampOne: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  wrapText: {
    overflowWrap: "anywhere",
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
  },
  auditItem: {
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: 8,
    padding: "6px 8px",
    background: "rgba(255,255,255,.02)",
  },
};
