import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { profileApi } from '@/db/api';
import { supabase } from '@/db/supabase';
import { Users, Shield, Edit, Ban, Trash2, CheckCircle, Wallet, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Profile } from '@/types/types';

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [updating, setUpdating] = useState(false);
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null);
  const [blockingUser, setBlockingUser] = useState<Profile | null>(null);
  const [addingBalanceUser, setAddingBalanceUser] = useState<Profile | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceNote, setBalanceNote] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await profileApi.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (user: Profile) => {
    setEditingUser(user);
    setNewRole(user.role);
  };

  const handleUpdateRole = async () => {
    if (!editingUser) return;

    try {
      setUpdating(true);
      await profileApi.updateUserRole(editingUser.id, newRole);
      
      toast({
        title: 'Success',
        description: `User role updated to ${newRole}`,
      });

      setEditingUser(null);
      await loadUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user role',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleBlockUser = async () => {
    if (!blockingUser) return;

    try {
      setUpdating(true);
      const newStatus = blockingUser.status === 'active' ? 'blocked' : 'active';
      await profileApi.updateUserStatus(blockingUser.id, newStatus);
      
      toast({
        title: 'Success',
        description: `User ${newStatus === 'blocked' ? 'blocked' : 'unblocked'} successfully`,
      });

      setBlockingUser(null);
      await loadUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user status',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      setUpdating(true);
      await profileApi.deleteUser(deletingUser.id);
      
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });

      setDeletingUser(null);
      await loadUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleWithdrawalBlock = async (user: Profile) => {
    try {
      setUpdating(true);
      const newBlockedStatus = !user.withdrawal_blocked;
      await profileApi.toggleWithdrawalBlock(user.id, newBlockedStatus);
      
      toast({
        title: 'Success',
        description: `Withdrawal ${newBlockedStatus ? 'blocked' : 'unblocked'} for ${user.username}`,
      });

      await loadUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle withdrawal block',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleAddBalance = async () => {
    if (!addingBalanceUser) return;

    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount greater than 0',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUpdating(true);
      
      // Get current admin user ID from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await profileApi.addBalanceToUser(
        addingBalanceUser.id,
        amount,
        user.id,
        balanceNote || undefined
      );
      
      toast({
        title: 'Success',
        description: `₹${amount.toFixed(2)} added to ${addingBalanceUser.username}'s wallet`,
      });

      setAddingBalanceUser(null);
      setBalanceAmount('');
      setBalanceNote('');
      await loadUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add balance',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48 bg-muted" />
        <Skeleton className="h-64 bg-muted" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage user accounts and roles</p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <span className="font-bold">{users.length} Users</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {user.role === 'admin' ? (
                        <Shield className="h-5 w-5 text-primary" />
                      ) : (
                        <Users className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-sm text-muted-foreground">
                        Referral Code: {user.referral_code}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className="font-bold">₹{user.balance.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                    <p className="font-bold text-success">₹{user.total_earnings.toFixed(2)}</p>
                  </div>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                  <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                    {user.status}
                  </Badge>
                  {user.kyc_status && (
                    <Badge
                      variant={
                        user.kyc_status === 'approved'
                          ? 'default'
                          : user.kyc_status === 'pending'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      KYC: {user.kyc_status}
                    </Badge>
                  )}
                  <Badge variant={user.withdrawal_blocked ? 'destructive' : 'default'}>
                    {user.withdrawal_blocked ? 'Withdrawal Blocked' : 'Withdrawal Allowed'}
                  </Badge>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditRole(user)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => setAddingBalanceUser(user)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Balance
                    </Button>
                    <Button
                      size="sm"
                      variant={user.withdrawal_blocked ? 'default' : 'destructive'}
                      onClick={() => handleToggleWithdrawalBlock(user)}
                      disabled={updating}
                    >
                      <Wallet className="h-4 w-4 mr-1" />
                      {user.withdrawal_blocked ? 'Allow Withdrawal' : 'Block Withdrawal'}
                    </Button>
                    <Button
                      size="sm"
                      variant={user.status === 'active' ? 'destructive' : 'default'}
                      onClick={() => setBlockingUser(user)}
                    >
                      {user.status === 'active' ? (
                        <>
                          <Ban className="h-4 w-4 mr-1" />
                          Block
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Unblock
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeletingUser(user)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Change the role for {editingUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={newRole} onValueChange={(value: 'user' | 'admin') => setNewRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={updating}>
              {updating ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block/Unblock User Confirmation */}
      <AlertDialog open={!!blockingUser} onOpenChange={() => setBlockingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {blockingUser?.status === 'active' ? 'Block User' : 'Unblock User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockingUser?.status === 'active' 
                ? `Are you sure you want to block ${blockingUser?.username}? They will not be able to access the platform.`
                : `Are you sure you want to unblock ${blockingUser?.username}? They will regain access to the platform.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleBlockUser} disabled={updating}>
              {updating ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingUser?.username}? This action cannot be undone and will permanently remove all user data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser} 
              disabled={updating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {updating ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Balance Dialog */}
      <Dialog open={!!addingBalanceUser} onOpenChange={() => {
        setAddingBalanceUser(null);
        setBalanceAmount('');
        setBalanceNote('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Balance to User</DialogTitle>
            <DialogDescription>
              Add balance directly to {addingBalanceUser?.username}'s wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea
                id="note"
                placeholder="Add a note for this transaction"
                value={balanceNote}
                onChange={(e) => setBalanceNote(e.target.value)}
                rows={3}
              />
            </div>
            {addingBalanceUser && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-lg font-bold">₹{addingBalanceUser.balance.toFixed(2)}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setAddingBalanceUser(null);
                setBalanceAmount('');
                setBalanceNote('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddBalance} disabled={updating || !balanceAmount}>
              {updating ? 'Adding...' : 'Add Balance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
