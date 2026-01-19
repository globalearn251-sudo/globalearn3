import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationApi } from '@/db/api';
import type { NotificationWithReadStatus } from '@/types/types';

export function ImportantNotificationBanner() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<NotificationWithReadStatus[]>([]);

  useEffect(() => {
    if (profile?.id) {
      loadImportantNotifications();
    }
  }, [profile?.id]);

  const loadImportantNotifications = async () => {
    if (!profile?.id) return;
    try {
      const data = await notificationApi.getImportantNotifications(profile.id);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load important notifications:', error);
    }
  };

  if (notifications.length === 0) return null;

  // Duplicate notifications for seamless scrolling
  const notificationContent = notifications.map((notification, index) => (
    <span key={notification.id} className="inline-block">
      <span className="font-semibold text-destructive">
        {notification.title}:
      </span>{' '}
      <span className="text-sm text-foreground">
        {notification.message}
      </span>
      {index < notifications.length - 1 && (
        <span className="mx-8 text-destructive">•</span>
      )}
      {index === notifications.length - 1 && (
        <span className="mx-8 text-destructive">•</span>
      )}
    </span>
  ));

  return (
    <div className="w-full bg-destructive/10 border border-destructive/20 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
        <div className="flex-1 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap">
            {notificationContent}
            {notificationContent}
          </div>
        </div>
      </div>
    </div>
  );
}
