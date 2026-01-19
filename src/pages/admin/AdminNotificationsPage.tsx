import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminNotificationApi } from '@/db/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Bell, Plus, Trash2, AlertCircle, Info } from 'lucide-react';
import type { Notification, NotificationType } from '@/types/types';

export default function AdminNotificationsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'general' as NotificationType,
  });
  const [stats, setStats] = useState<Record<string, { total: number; read: number; unread: number }>>({});

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await adminNotificationApi.getAllNotifications();
      setNotifications(data);

      // Load stats for each notification
      const statsPromises = data.map(async (notif) => {
        const stat = await adminNotificationApi.getNotificationStats(notif.id);
        return { id: notif.id, stat };
      });

      const statsResults = await Promise.all(statsPromises);
      const statsMap: Record<string, { total: number; read: number; unread: number }> = {};
      statsResults.forEach(({ id, stat }) => {
        statsMap[id] = stat;
      });
      setStats(statsMap);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to load notifications: ${error.message || 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!profile?.id) return;

    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all fields',
      });
      return;
    }

    try {
      await adminNotificationApi.createNotification(
        formData.title,
        formData.message,
        formData.type,
        profile.id
      );

      toast({
        title: 'Success',
        description: 'Notification sent to all users',
      });

      setIsCreateDialogOpen(false);
      setFormData({ title: '', message: '', type: 'general' });
      loadNotifications();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to create notification: ${error.message || 'Unknown error'}`,
      });
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;

    try {
      await adminNotificationApi.deleteNotification(notificationId);
      toast({
        title: 'Success',
        description: 'Notification deleted',
      });
      loadNotifications();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to delete notification: ${error.message || 'Unknown error'}`,
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Manage system-wide notifications</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Notification
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Notification</DialogTitle>
              <DialogDescription>
                Send a notification to all users
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter notification title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter notification message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: NotificationType) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        General
                      </div>
                    </SelectItem>
                    <SelectItem value="important">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Important
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Important notifications will be displayed as a scrolling banner on the home page
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Send Notification</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
            <p className="text-sm text-muted-foreground">Create your first notification to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {notifications.map((notification) => (
            <Card key={notification.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{notification.title}</CardTitle>
                      {notification.type === 'important' ? (
                        <Badge variant="destructive">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Important
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Info className="mr-1 h-3 w-3" />
                          General
                        </Badge>
                      )}
                      {!notification.is_active && (
                        <Badge variant="outline">Deleted</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Created: {formatDate(notification.created_at)}
                    </p>
                  </div>
                  {notification.is_active && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(notification.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{notification.message}</p>
                {stats[notification.id] && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{stats[notification.id].total}</span>
                      <span>Total Users</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-success">{stats[notification.id].read}</span>
                      <span>Read</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-destructive">{stats[notification.id].unread}</span>
                      <span>Unread</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
