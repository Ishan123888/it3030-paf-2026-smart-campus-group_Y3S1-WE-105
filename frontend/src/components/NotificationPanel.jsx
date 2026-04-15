import { useEffect, useState } from "react";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../api/api";

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const data = await getUnreadCount();
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpen = () => {
    setOpen(!open);
    if (!open) loadNotifications();
  };

  const handleMarkAsRead = async (id) => {
    await markAsRead(id);
    loadNotifications();
    loadUnreadCount();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    loadNotifications();
    loadUnreadCount();
  };

  const handleDelete = async (id) => {
    await deleteNotification(id);
    loadNotifications();
    loadUnreadCount();
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Bell Icon */}
      <button onClick={handleOpen} style={{
        background: "none", border: "none", cursor: "pointer",
        fontSize: "24px", position: "relative"
      }}>
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: "-5px", right: "-5px",
            backgroundColor: "red", color: "white",
            borderRadius: "50%", padding: "2px 6px",
            fontSize: "11px", fontWeight: "bold"
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "40px",
          width: "350px", backgroundColor: "white",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          borderRadius: "12px", zIndex: 1000,
          maxHeight: "400px", overflowY: "auto"
        }}>
          {/* Header */}
          <div style={{
            padding: "16px", borderBottom: "1px solid #eee",
            display: "flex", justifyContent: "space-between",
            alignItems: "center"
          }}>
            <h3 style={{ margin: 0, fontSize: "16px" }}>
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} style={{
                background: "none", border: "none",
                color: "#4285f4", cursor: "pointer", fontSize: "13px"
              }}>
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          {notifications.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "#999" }}>
              No notifications
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} style={{
                padding: "12px 16px",
                backgroundColor: n.read ? "white" : "#f0f7ff",
                borderBottom: "1px solid #f5f5f5",
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start"
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 4px 0", fontSize: "14px" }}>
                    {n.message}
                  </p>
                  <span style={{ fontSize: "11px", color: "#999" }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px", marginLeft: "8px" }}>
                  {!n.read && (
                    <button onClick={() => handleMarkAsRead(n.id)} style={{
                      background: "none", border: "none",
                      color: "#4285f4", cursor: "pointer", fontSize: "12px"
                    }}>
                      ✓
                    </button>
                  )}
                  <button onClick={() => handleDelete(n.id)} style={{
                    background: "none", border: "none",
                    color: "#ff4444", cursor: "pointer", fontSize: "12px"
                  }}>
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}