import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, CheckCheck, Ticket, MessageSquare, AlertTriangle, UserPlus, RefreshCw, X } from 'lucide-react';
import { AppNotification } from '../../types';
import { fetchNotificationsApi, fetchUnreadCountApi, markNotificationReadApi, markAllNotificationsReadApi, savePushSubscriptionApi } from '../../services/api';

interface NotificationBellProps {
  onNavigateToTicket?: (ticketId: string) => void;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  ticket_created: <Ticket className="w-4 h-4 text-blue-400" />,
  ticket_assigned: <UserPlus className="w-4 h-4 text-emerald-400" />,
  status_changed: <RefreshCw className="w-4 h-4 text-amber-400" />,
  comment_added: <MessageSquare className="w-4 h-4 text-violet-400" />,
  ticket_escalated: <AlertTriangle className="w-4 h-4 text-rose-400" />,
};

const NOTIFICATION_ACCENT: Record<string, string> = {
  ticket_created: 'border-l-blue-500',
  ticket_assigned: 'border-l-emerald-500',
  status_changed: 'border-l-amber-500',
  comment_added: 'border-l-violet-500',
  ticket_escalated: 'border-l-rose-500',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigateToTicket }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [pushPermission, setPushPermission] = useState<string>('default');
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  const handleEnablePush = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    setIsSubscribingPush(true);
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission === 'granted') {
        const reg = await navigator.serviceWorker.ready;
        const VAPID_PUBLIC_KEY = 'BNv3Xi1dHS2jfmZC9EWF4gP_4DDmZhoOSfWdE0ncbWYe2aXDw0EAE_XWvK3p9Hd8mugIeh5xkLnhWKcUnq6oJ_A';
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
        });
        await savePushSubscriptionApi(sub.toJSON());
      }
    } catch (e) {
      console.warn('Failed to subscribe to Web Push:', e);
    } finally {
      setIsSubscribingPush(false);
    }
  };


  // Fetch unread count on mount and every 15 seconds
  const pollUnreadCount = useCallback(async () => {
    const count = await fetchUnreadCountApi();
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    pollUnreadCount();
    const interval = setInterval(pollUnreadCount, 15000); // ← 15 s (was 30 s)

    // Refresh immediately when the user switches back to this tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        pollUnreadCount();
        if (isOpen) fetchNotificationsApi().then(setNotifications);
      }
    };

    const handleRefresh = () => {
      pollUnreadCount();
      if (isOpen) {
        fetchNotificationsApi().then(setNotifications);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('techbridge:notification-refresh', handleRefresh);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('techbridge:notification-refresh', handleRefresh);
    };
  }, [pollUnreadCount, isOpen]);

  // When panel opens, fetch the full notification list
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetchNotificationsApi().then((data) => {
        setNotifications(data);
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  // Close panel on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    const success = await markNotificationReadApi(id);
    if (success) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllRead = async () => {
    const success = await markAllNotificationsReadApi();
    if (success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  const handleClickNotification = (notification: AppNotification) => {
    if (!notification.is_read) {
      handleMarkRead(notification.id);
    }
    if (notification.data?.ticket_id && onNavigateToTicket) {
      onNavigateToTicket(notification.data.ticket_id);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={bellRef}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200 ${
          isOpen
            ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:border-slate-700 hover:text-slate-200'
        }`}
        title="Notifications"
        id="notification-bell"
      >
        <Bell className={`w-[18px] h-[18px] transition-transform duration-200 ${isOpen ? 'scale-110' : ''}`} />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full shadow-lg shadow-rose-500/30 animate-bounce-subtle ring-2 ring-slate-900">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 mt-2 w-[380px] max-h-[480px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/40 z-50 flex flex-col overflow-hidden"
          style={{ animation: 'notif-slide-in 0.2s ease-out' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/95 backdrop-blur flex-shrink-0">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full border border-blue-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center space-x-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded-lg transition"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Read all</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Web Push Subscription Banner */}
          {pushPermission === 'default' && (
            <div className="px-4 py-2.5 bg-blue-600/10 border-b border-blue-500/20 flex items-center justify-between gap-2">
              <div className="text-[11px] text-blue-300">
                <span className="font-semibold block">Enable Push Alerts</span>
                Get real-time updates when offline or app is closed.
              </div>
              <button
                onClick={handleEnablePush}
                disabled={isSubscribingPush}
                className="px-2.5 py-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition flex-shrink-0 disabled:opacity-50"
              >
                {isSubscribingPush ? 'Enabling…' : 'Enable'}
              </button>
            </div>
          )}


          {/* Notification List */}
          <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Loading notifications…</span>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-slate-600" />
                </div>
                <p className="text-sm font-semibold text-slate-400">All caught up!</p>
                <p className="text-xs text-slate-500 mt-1">No notifications yet. They'll appear here when ticket events happen.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClickNotification(n)}
                    className={`w-full text-left px-4 py-3 flex items-start space-x-3 transition-all duration-150 border-l-[3px] ${
                      NOTIFICATION_ACCENT[n.type] || 'border-l-slate-700'
                    } ${
                      n.is_read
                        ? 'bg-transparent hover:bg-slate-800/40 opacity-60'
                        : 'bg-blue-500/[0.04] hover:bg-blue-500/[0.08]'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5 ${
                      n.is_read ? 'bg-slate-800' : 'bg-slate-800/80 ring-1 ring-slate-700'
                    }`}>
                      {NOTIFICATION_ICONS[n.type] || <Bell className="w-4 h-4 text-slate-400" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-semibold leading-snug ${n.is_read ? 'text-slate-400' : 'text-white'}`}>
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1 shadow-sm shadow-blue-500/40" />
                        )}
                      </div>
                      <p className={`text-[11px] mt-0.5 leading-relaxed line-clamp-2 ${n.is_read ? 'text-slate-500' : 'text-slate-400'}`}>
                        {n.body}
                      </p>
                      <div className="flex items-center space-x-2 mt-1.5">
                        <span className="text-[10px] text-slate-500 font-medium">{timeAgo(n.created_at)}</span>
                        {n.data?.ticket_number && (
                          <span className="text-[10px] font-mono text-blue-400/70 bg-blue-500/10 px-1.5 py-0.5 rounded">
                            {n.data.ticket_number}
                          </span>
                        )}
                        {n.data?.priority && ['High', 'Critical'].includes(n.data.priority) && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            n.data.priority === 'Critical'
                              ? 'bg-rose-500/15 text-rose-400'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}>
                            {n.data.priority}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mark as read button (only for unread) */}
                    {!n.is_read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead(n.id);
                        }}
                        className="flex-shrink-0 p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition mt-0.5"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-800 px-4 py-2.5 bg-slate-900/95 flex-shrink-0">
              <p className="text-[10px] text-slate-500 text-center">
                Showing latest {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Keyframe animation (inline style to avoid needing global CSS) */}
      <style>{`
        @keyframes notif-slide-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
};
