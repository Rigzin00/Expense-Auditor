import { createContext, useState, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextProps {
  notifications: Notification[];
  addNotification: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  markAllAsRead: () => void;
  syncBackendNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // Track IDs already known to avoid duplication when polling
  const [seenIds] = useState<Set<string>>(new Set());

  const addNotification = useCallback((type: 'success' | 'error' | 'info', title: string, message: string) => {
    const newNotif: Notification = {
      id: `notif_${Date.now()}`,
      type,
      title,
      message,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    seenIds.add(newNotif.id);
    setNotifications(prev => [newNotif, ...prev]);
  }, [seenIds]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    // Also mark as read on the backend
    fetch(`${API_URL}/api/v1/notifications/mark-read`, { method: 'POST' }).catch(() => {});
  }, []);

  /**
   * Polls the backend for new notifications and merges them into local state.
   * De-duplicates by ID to avoid double-showing when called repeatedly.
   */
  const syncBackendNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/notifications`);
      if (!res.ok) return;
      const data = await res.json();
      const backendNotifs: Notification[] = (data.data || []).filter((n: Notification) => !seenIds.has(n.id));
      if (backendNotifs.length === 0) return;
      backendNotifs.forEach(n => seenIds.add(n.id));
      setNotifications(prev => {
        // Merge backend notifs at the front, preserving local ones
        const combined = [...backendNotifs, ...prev];
        // Deduplicate by id (local notifs take precedence for isRead state)
        const seen = new Set<string>();
        return combined.filter(n => {
          if (seen.has(n.id)) return false;
          seen.add(n.id);
          return true;
        });
      });
    } catch {
      // Backend offline — ignore silently
    }
  }, [seenIds]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAllAsRead, syncBackendNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};