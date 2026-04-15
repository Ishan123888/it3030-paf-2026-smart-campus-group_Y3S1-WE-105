import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

/**
 * useNotifications — fixed version
 *
 * Fixes:
 * 1. Polling now refreshes both count AND full list when panel is open
 * 2. deleteNotification correctly computes wasUnread from current state snapshot
 * 3. Cleans up interval on unmount / when user logs out
 * 4. Exposes `refresh` so callers can force a reload
 */
const POLL_INTERVAL_MS = 30_000; // 30 s

export default function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(false);

  // Track whether the notification panel is open so we can refresh the full
  // list (not just the count) while it's visible.
  const panelOpenRef = useRef(false);

  /* ── fetchers ─────────────────────────────────────────────────────────── */

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
      // Sync count from list to avoid a second round-trip
      const unread = (res.data || []).filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications/count');
      const count = res.data?.unreadCount ?? 0;
      setUnreadCount(count);
      // If panel is open, keep the list fresh too
      if (panelOpenRef.current) {
        const listRes = await api.get('/notifications');
        setNotifications(listRes.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  }, []);

  /* ── actions ──────────────────────────────────────────────────────────── */

  const markAsRead = useCallback(async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    // Capture wasUnread from current state BEFORE the async call
    setNotifications(prev => {
      const target = prev.find(n => n.id === id);
      if (target && !target.read) {
        setUnreadCount(c => Math.max(0, c - 1));
      }
      return prev.filter(n => n.id !== id);
    });
    try {
      await api.delete(`/notifications/${id}`);
    } catch (err) {
      console.error('Failed to delete notification', err);
      // Re-fetch to restore correct state if the delete failed
      fetchNotifications();
    }
  }, [fetchNotifications]);

  /* ── panel open/close helper (call from Navbar) ───────────────────────── */

  const setPanelOpen = useCallback((open) => {
    panelOpenRef.current = open;
    if (open) {
      fetchNotifications();
    }
  }, [fetchNotifications]);

  /* ── lifecycle ────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Initial load
    fetchNotifications();

    // Poll
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user, fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setPanelOpen,       // <-- new: call with true/false when panel toggles
    refresh: fetchNotifications,
  };
}