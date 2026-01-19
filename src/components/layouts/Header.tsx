import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationApi } from '@/db/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import type { NotificationWithReadStatus } from '@/types/types';

export function Header() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<NotificationWithReadStatus[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      loadUnreadCount();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (isOpen && profile?.id) {
      loadNotifications();
    }
  }, [isOpen, profile?.id]);

  const loadUnreadCount = async () => {
    if (!profile?.id) return;
    try {
      const count = await notificationApi.getUnreadCount(profile.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const loadNotifications = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const data = await notificationApi.getUserNotifications(profile.id);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!profile?.id) return;
    try {
      await notificationApi.markAsRead(profile.id, notificationId);
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!profile?.id) return;
    try {
      await notificationApi.markAllAsRead(profile.id);
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left side - User Greeting */}
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">
            Welcome back, <span className="text-primary">{profile?.username || 'User'}</span>
          </p>
        </div>

        {/* Right side - Notification Icon */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Notifications</SheetTitle>
              <SheetDescription>
                Stay updated with the latest announcements
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 space-y-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="w-full"
                >
                  Mark all as read
                </Button>
              )}

              <ScrollArea className="h-[calc(100vh-200px)]">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notification) => (
                      <Card
                        key={notification.id}
                        className={`cursor-pointer transition-colors ${
                          !notification.is_read ? 'bg-accent/50' : ''
                        }`}
                        onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm">
                                  {notification.title}
                                </p>
                                {notification.type === 'important' && (
                                  <Badge variant="destructive" className="text-xs">
                                    Important
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(notification.created_at)}
                              </p>
                            </div>
                            {!notification.is_read && (
                              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
