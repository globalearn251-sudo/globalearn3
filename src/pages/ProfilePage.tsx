import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { userProductApi, transactionApi, rechargeApi, withdrawalApi, kycApi } from '@/db/api';
import { User, ShoppingBag, Receipt, Upload, LogOut, Shield } from 'lucide-react';
import type { UserProduct, Transaction, RechargeRequest, WithdrawalRequest, KycSubmission } from '@/types/types';

export default function ProfilePage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<UserProduct[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rechargeRequests, setRechargeRequests] = useState<RechargeRequest[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [kycSubmission, setKycSubmission] = useState<KycSubmission | null>(null);

  useEffect(() => {
    if (profile) {
      console.log('ProfilePage: Profile loaded, loading data...', {
        id: profile.id,
        role: profile.role,
        isAdmin: profile.role === 'admin'
      });
      loadData();
    } else {
      console.log('ProfilePage: No profile yet');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]); // Only depend on profile.id

  const loadData = async () => {
    if (!profile) {
      console.log('ProfilePage: loadData called but no profile');
      setLoading(false); // Don't stay in loading state
      return;
    }
    
    console.log('ProfilePage: Starting to load data for user', profile.id, 'role:', profile.role);
    
    try {
      setLoading(true);
      const [ordersData, txData, rechargeData, withdrawalData, kycData] = await Promise.all([
        userProductApi.getUserProducts(profile.id).catch((err) => {
          console.error('Error loading orders:', err);
          return [];
        }),
        transactionApi.getUserTransactions(profile.id, 20).catch((err) => {
          console.error('Error loading transactions:', err);
          return [];
        }),
        rechargeApi.getUserRechargeRequests(profile.id).catch((err) => {
          console.error('Error loading recharge requests:', err);
          return [];
        }),
        withdrawalApi.getUserWithdrawalRequests(profile.id).catch((err) => {
          console.error('Error loading withdrawal requests:', err);
          return [];
        }),
        kycApi.getUserKyc(profile.id).catch((err) => {
          console.error('Error loading KYC:', err);
          return null;
        }),
      ]);
      
      console.log('ProfilePage: Data loaded successfully', {
        orders: ordersData.length,
        transactions: txData.length,
        recharges: rechargeData.length,
        withdrawals: withdrawalData.length,
        hasKyc: !!kycData,
        userRole: profile.role
      });
      
      setOrders(ordersData);
      setTransactions(txData);
      setRechargeRequests(rechargeData);
      setWithdrawalRequests(withdrawalData);
      setKycSubmission(kycData);
      
      console.log('ProfilePage: UI should now be visible for', profile.role, 'user');
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4 pb-20">
        <Skeleton className="h-32 bg-muted" />
        <Skeleton className="h-64 bg-muted" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle>{profile?.username}</CardTitle>
                  <p className="text-sm text-muted-foreground capitalize">{profile?.role}</p>
                </div>
              </div>
              <Button variant="outline" size="icon" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Member ID</span>
              <span className="font-mono font-bold">{profile?.referral_code}</span>
            </div>
            
            {profile?.role === 'admin' && (
              <Button onClick={() => navigate('/admin')} className="w-full mt-4" variant="secondary">
                <Shield className="mr-2 h-4 w-4" />
                Admin Panel
              </Button>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  My Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No orders yet</p>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{order.product?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Purchased: {new Date(order.purchased_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={order.is_active ? 'default' : 'secondary'}>
                            {order.is_active ? 'Active' : 'Completed'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Price</p>
                            <p className="font-medium">₹{order.purchase_price.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Earned</p>
                            <p className="font-medium text-success">₹{order.total_earned.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Days Left</p>
                            <p className="font-medium">{order.days_remaining}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No transactions yet</p>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium capitalize">{tx.type.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tx.created_at).toLocaleString()}
                          </p>
                          {tx.description && (
                            <p className="text-xs text-muted-foreground">{tx.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ₹{tx.amount >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {tx.amount >= 0 ? '+' : ''}₹{tx.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Balance: ₹{tx.balance_after.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recharge Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {rechargeRequests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No recharge requests</p>
                ) : (
                  <div className="space-y-2">
                    {rechargeRequests.map((req) => (
                      <div key={req.id} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">₹{req.amount.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(req.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(req.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Withdrawal Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {withdrawalRequests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No withdrawal requests</p>
                ) : (
                  <div className="space-y-2">
                    {withdrawalRequests.map((req) => (
                      <div key={req.id} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">₹{req.amount.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(req.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(req.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kyc" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  KYC Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                {kycSubmission ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status</span>
                      {getStatusBadge(kycSubmission.status)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Submitted</span>
                      <span className="text-sm">{new Date(kycSubmission.created_at).toLocaleDateString()}</span>
                    </div>
                    {kycSubmission.admin_note && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Admin Note</p>
                        <p className="text-sm">{kycSubmission.admin_note}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">KYC not submitted yet</p>
                    <Button onClick={() => navigate('/kyc-submit')}>
                      Submit KYC Documents
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
