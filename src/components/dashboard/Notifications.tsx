import { useEffect, useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type?: string;
  read?: boolean;
  link?: string | null;
  created_at?: string;
  notification_method?: 'email' | 'whatsapp' | 'in-app';
}

interface UserPreferences {
  send_whatsapp: boolean;
  send_email: boolean;
}

export const Notifications = ({ userId }: { userId: string }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    send_whatsapp: true,
    send_email: true,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    let mounted = true;

    // Fetch user notification preferences
    const fetchUserPreferences = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("profiles")
          .select("send_whatsapp, send_email")
          .eq("id", userId)
          .single();

        if (error) throw error;
        if (mounted && data) {
          setUserPreferences({
            send_whatsapp: data.send_whatsapp ?? true,
            send_email: data.send_email ?? true,
          });
        }
      } catch (err) {
        console.error("Error loading user preferences:", err);
        // Default to true if fetch fails
        if (mounted) {
          setUserPreferences({
            send_whatsapp: true,
            send_email: true,
          });
        }
      }
    };

    const fetchNotifications = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;
        if (mounted) setNotifications((data as any[]) || []);
      } catch (err) {
        console.error("Error loading notifications:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUserPreferences();
    fetchNotifications();

    // Realtime subscription for notifications - NO POLLING to prevent cascade re-renders
    try {
      const channel = supabase
        .channel(`notifications-user-${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
          (payload) => {
            console.log('Notification event:', payload.eventType);
            
            // Only refetch for new notifications (INSERT), not for updates
            // This prevents unnecessary re-renders when marking as read
            if (payload.eventType === "INSERT" && payload.new && !payload.new.read) {
              // Show toast for new unread notifications only
              toast.info(payload.new.title || "New notification");
              // Fetch to get the new notification
              fetchNotifications();
            } else if (payload.eventType === "UPDATE") {
              // For updates (like marking as read), just update the local state
              // instead of refetching the entire list
              if (mounted) {
                setNotifications((prev) =>
                  prev.map((n) =>
                    n.id === payload.new.id ? { ...n, read: payload.new.read } : n
                  )
                );
              }
            }
          }
        )
        .subscribe((status) => {
          // status values: 'SUBSCRIBED', 'CHANNEL_ERROR', 'CLOSED', etc.
          if (status === "SUBSCRIBED") {
            // Suppress verbose logging in development
          } else if (status === "CHANNEL_ERROR" || status === "CLOSED") {
            // Realtime connection failed - expected in local dev
            // DO NOT USE POLLING - it causes the entire dashboard to re-render every 5 seconds
            // which cascades to all child components including PatientAppointmentHistory
          }
        });

      return () => {
        mounted = false;
        try {
          supabase.removeChannel(channel);
        } catch (e) {
          // ignore
        }
      };
    } catch (error) {
      // Realtime subscription setup failed - expected behavior
      // DO NOT USE POLLING FALLBACK
      return () => {
        mounted = false;
      };
    }
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Filter notifications based on user preferences
  const visibleNotifications = notifications.filter((n) => {
    if (!n.notification_method) return true; // Show in-app by default
    if (n.notification_method === 'email' && !userPreferences.send_email) return false;
    if (n.notification_method === 'whatsapp' && !userPreferences.send_whatsapp) return false;
    return true;
  });

  const markAsRead = async (id: string, link?: string | null, event?: React.MouseEvent) => {
    // Prevent default dropdown menu behavior
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    try {
      // Immediately update UI optimistically
      setNotifications((prev) => prev.map((p) => (p.id === id ? { ...p, read: true } : p)));
      
      // Then update database (non-blocking)
      const { error } = await (supabase as any).from("notifications").update({ read: true }).eq("id", id);
      if (error) {
        console.error("Error marking notification as read:", error);
        // Revert optimistic update on error
        setNotifications((prev) => prev.map((p) => (p.id === id ? { ...p, read: false } : p)));
        return;
      }
      
      // Navigate to link if provided
      if (link) {
        // Fix old notification links
        const validLink = link.replace('/dashboard/appointments', '/dashboard');
        
        // For emergency booking notifications, dispatch event to scroll to section
        // instead of navigating (prevents full page reload)
        if (validLink.includes('doctor-dashboard')) {
          // Dispatch custom event to scroll to emergency bookings section
          window.dispatchEvent(new CustomEvent('scrollToEmergencyBookings', { 
            detail: { smooth: true } 
          }));
        } else {
          // For other links, navigate normally
          navigate(validLink, { replace: false });
        }
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
      toast.error("Failed to mark notification read");
    }
  };

  const markAllRead = async () => {
    try {
      const { error } = await (supabase as any).from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
      if (error) throw error;
      setNotifications((prev) => prev.map((p) => ({ ...p, read: true })));
      toast.success("All notifications marked read");
    } catch (err) {
      console.error("Error marking all notifications read:", err);
      toast.error("Failed to mark all read");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium leading-none text-white bg-destructive rounded-full">{unreadCount}</span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[calc(100vw-24px)] sm:w-96 max-h-[500px] overflow-y-auto p-0">
        <div className="sticky top-0 bg-background border-b border-border/50 p-2 sm:p-3 z-10">
          <div className="flex items-center justify-between gap-1.5">
            <span className="font-semibold text-xs sm:text-sm">Notifications</span>
            <Button size="sm" variant="ghost" onClick={markAllRead} className="h-6 sm:h-7 px-1.5 sm:px-2 text-xs flex-shrink-0">
              <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
              <span className="hidden sm:inline">Mark all</span>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground text-center">Loading...</div>
        ) : visibleNotifications.length === 0 ? (
          <div className="p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground text-center">No notifications</div>
        ) : (
          <div className="divide-y divide-border/30">
            {visibleNotifications.map((n) => (
              <button
                key={n.id}
                onClick={(e) => markAsRead(n.id, n.link, e as React.MouseEvent)}
                className={`w-full px-2 sm:px-3 py-2 sm:py-2.5 text-left hover:bg-accent/50 transition-colors ${n.read ? 'opacity-60' : ''}`}
              >
                <div className="flex flex-col gap-1 sm:gap-2">
                  <div className="flex flex-col min-w-0">
                    <div className={`text-xs sm:text-sm truncate text-foreground ${!n.read ? 'font-semibold' : 'font-medium'}`}>{n.title}</div>
                    <div className="text-xs text-foreground/70 line-clamp-2">{n.message}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {n.created_at ? new Date(n.created_at).toLocaleString('en-US', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Notifications;
