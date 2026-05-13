import { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useJeevikaStore } from "../lib/store.js";
import { notificationApi, authApi } from "../lib/api.js";
import { initSocket } from "../lib/socket.js";
import { Button } from "./ui/Button.jsx";
import { Badge } from "./ui/Card.jsx";
import { toast } from "sonner";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, setNotifications, markNotificationAsRead, user } = useJeevikaStore();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const data = await notificationApi.list();
        setNotifications(data);
      } catch (err) {
        console.error("Failed to load notifications");
      }
    }
    fetchNotifications();
    
    // Phase 3: Real-time Socket Connection
    if (user && user.id) {
      const socket = initSocket(user.id);
      
      socket.on("notification", (notif) => {
        console.log("Real-time notification received:", notif);
        // Prepend new notification to state
        setNotifications((prev) => [notif, ...prev]);
        
        // Show a nice toast alert
        toast(notif.title, {
          description: notif.message,
          action: notif.actionUrl ? {
            label: "View",
            onClick: () => navigate(notif.actionUrl)
          } : undefined
        });
      });

      return () => {
        socket.off("notification");
      };
    }
  }, [setNotifications, user, navigate]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      markNotificationAsRead(id);
    } catch (err) {
      console.error("Failed to mark as read");
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationApi.clearAll();
      setNotifications([]);
    } catch (err) {
      console.error("Failed to clear notifications");
    }
  };

  const handleEnablePush = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Permission denied for notifications");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: "BJzarb7YAju0sZi9S4-16Sw142vWD5gG_rKvCejAjBtTolwIi7c5868bfupeUqjXK0D_TnROgtAvNYt9KRlAn9Q"
      });

      await authApi.savePushSubscription(subscription);
      toast.success("Push notifications enabled!");
    } catch (err) {
      console.error("Failed to enable push:", err);
      toast.error("Failed to enable push notifications");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="ghost" 
        size="sm" 
        className="relative" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 rounded-3xl border border-white/10 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-2xl z-50"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-lg font-black">Notifications</h3>
              <div className="flex gap-2">
                <button 
                  onClick={handleEnablePush}
                  className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-lg hover:bg-emerald-500/20 transition"
                >
                  Enable Push
                </button>
                <button 
                  onClick={handleClearAll}
                  className="text-xs text-muted-foreground hover:text-rose-400 transition"
                >
                  Clear all
                </button>
              </div>
            </div>

            <div className="mt-4 max-h-[400px] overflow-y-auto no-scrollbar space-y-3">
              {notifications.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`group relative rounded-2xl p-3 transition-colors ${n.isRead ? 'bg-white/5 opacity-70' : 'bg-emerald-500/10 border border-emerald-500/20'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-bold leading-none">{n.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                        {n.actionUrl && (
                          <button 
                            onClick={() => { navigate(n.actionUrl); setIsOpen(false); }}
                            className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300"
                          >
                            <ExternalLink className="h-3 w-3" /> View details
                          </button>
                        )}
                      </div>
                      {!n.isRead && (
                        <button 
                          onClick={() => handleMarkRead(n.id)}
                          className="rounded-full bg-emerald-500/20 p-1 text-emerald-400 opacity-0 group-hover:opacity-100 transition"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
