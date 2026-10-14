import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { playNotificationChime } from './soundHelper';

export function useInAppNotifications({ user, role = 'customer' } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFloatingNotification, setActiveFloatingNotification] = useState(null);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [activeChatOrder, setActiveChatOrder] = useState(null);
  
  const lastPolledTimeRef = useRef(new Date().toISOString());
  const seenNotificationIdsRef = useRef(new Set());
  const isInitialLoadRef = useRef(true);

  const phone = user?.phone || user?.contactNumber || '';

  // Initial full fetch of notifications
  const loadNotifications = useCallback(async () => {
    try {
      const res = await api.getNotifications({
        phone,
        role,
        limit: 40
      });
      if (res.success && Array.isArray(res.data)) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount || 0);

        // Populate seen set so we don't alert old notifications on first load
        if (isInitialLoadRef.current) {
          res.data.forEach(n => seenNotificationIdsRef.current.add(n._id));
          isInitialLoadRef.current = false;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch initial notifications:', e);
    }
  }, [phone, role]);

  // Periodic poll for status changes and messages
  const poll = useCallback(async () => {
    try {
      const res = await api.pollNotifications({
        phone,
        role,
        since: lastPolledTimeRef.current
      });

      lastPolledTimeRef.current = res.polledAt || new Date().toISOString();

      if (res.success) {
        setUnreadCount(res.unreadCount || 0);

        // If new notifications arrived that we haven't seen in this session
        if (res.hasNew && Array.isArray(res.items) && res.items.length > 0) {
          const freshItems = res.items.filter(item => !seenNotificationIdsRef.current.has(item._id));
          
          if (freshItems.length > 0) {
            freshItems.forEach(item => seenNotificationIdsRef.current.add(item._id));

            // Show floating banner for the freshest item
            const newest = freshItems[0];
            setActiveFloatingNotification(newest);

            // Play gentle audio chime
            playNotificationChime();

            // Prepend fresh items to local list
            setNotifications(prev => {
              const existingIds = new Set(prev.map(p => p._id));
              const additions = freshItems.filter(f => !existingIds.has(f._id));
              return [...additions, ...prev];
            });
          }
        }
      }
    } catch (e) {
      // Silently ignore network hiccup during background polling
    }
  }, [phone, role]);

  // Start polling
  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      poll();
    }, 6000);

    const onFocus = () => {
      poll();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [loadNotifications, poll]);

  const markNotificationRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.warn('Failed to mark notification read:', e);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead({ phone, role });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.warn('Failed to mark all notifications read:', e);
    }
  };

  const openOrderChat = (orderOrNumber) => {
    if (typeof orderOrNumber === 'string') {
      setActiveChatOrder({ orderNumber: orderOrNumber });
    } else {
      setActiveChatOrder(orderOrNumber);
    }
  };

  const closeOrderChat = () => {
    setActiveChatOrder(null);
  };

  const openNotificationCenter = () => {
    setIsNotificationCenterOpen(true);
  };

  const closeNotificationCenter = () => {
    setIsNotificationCenterOpen(false);
  };

  const dismissFloatingNotification = () => {
    setActiveFloatingNotification(null);
  };

  return {
    notifications,
    unreadCount,
    activeFloatingNotification,
    isNotificationCenterOpen,
    activeChatOrder,
    openOrderChat,
    closeOrderChat,
    openNotificationCenter,
    closeNotificationCenter,
    markNotificationRead,
    markAllNotificationsRead,
    dismissFloatingNotification,
    refreshNotifications: loadNotifications
  };
}
