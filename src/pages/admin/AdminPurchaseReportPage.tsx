import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { userProductApi } from '@/db/api';
import { ShoppingBag, Search, TrendingUp, Calendar, IndianRupee } from 'lucide-react';
import type { UserProduct } from '@/types/types';

export default function AdminPurchaseReportPage() {
  const [purchases, setPurchases] = useState<UserProduct[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<UserProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPurchases();
  }, []);

  useEffect(() => {
    filterPurchases();
  }, [searchTerm, purchases]);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const data = await userProductApi.getAllUserProducts();
      setPurchases(data);
      setFilteredPurchases(data);
    } catch (error) {
      console.error('Error loading purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPurchases = () => {
    if (!searchTerm) {
      setFilteredPurchases(purchases);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = purchases.filter(
      (purchase) =>
        purchase.user?.username?.toLowerCase().includes(term) ||
        purchase.product?.name?.toLowerCase().includes(term)
    );
    setFilteredPurchases(filtered);
  };

  const getStatusBadge = (isActive: boolean, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    if (isExpired) {
      return <Badge variant="outline">Expired</Badge>;
    }
    if (isActive) {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  const calculateProgress = (contractDays: number, daysRemaining: number) => {
    const daysCompleted = contractDays - daysRemaining;
    return Math.round((daysCompleted / contractDays) * 100);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64 bg-muted" />
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Purchase Report</h1>
          <p className="text-muted-foreground">View all product purchases by users</p>
        </div>
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-8 w-8 text-primary" />
          <div>
            <p className="text-2xl font-bold">{purchases.length}</p>
            <p className="text-xs text-muted-foreground">Total Purchases</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username or product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {filteredPurchases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {searchTerm ? 'No purchases found matching your search' : 'No purchases yet'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPurchases.map((purchase) => (
            <Card key={purchase.id}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Left Column - User & Product Info */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">User</p>
                      <p className="text-lg font-bold">{purchase.user?.username || 'Unknown User'}</p>
                      {purchase.user?.email && (
                        <p className="text-xs text-muted-foreground">{purchase.user.email}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Product</p>
                      <p className="text-lg font-bold">{purchase.product?.name || 'Unknown Product'}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Purchase Date</p>
                        <p className="font-medium">
                          {new Date(purchase.purchased_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      {getStatusBadge(purchase.is_active, purchase.expires_at)}
                    </div>
                  </div>

                  {/* Right Column - Financial Details */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Purchase Price</p>
                          <p className="font-bold text-lg">₹{purchase.purchase_price.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-success" />
                        <div>
                          <p className="text-xs text-muted-foreground">Daily Earning</p>
                          <p className="font-bold text-lg text-success">
                            ₹{purchase.daily_earning.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Earned</p>
                        <p className="font-bold text-success">₹{purchase.total_earned.toFixed(2)}</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Expected Total</p>
                        <p className="font-bold">
                          ₹{(purchase.daily_earning * purchase.contract_days).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground">Contract Progress</p>
                        <p className="text-xs font-medium">
                          {purchase.contract_days - purchase.days_remaining} / {purchase.contract_days} days
                        </p>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{
                            width: `${calculateProgress(purchase.contract_days, purchase.days_remaining)}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {purchase.days_remaining} days remaining
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Expires On</p>
                      <p className="font-medium">
                        {new Date(purchase.expires_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>

                    {purchase.last_earning_date && (
                      <div>
                        <p className="text-xs text-muted-foreground">Last Earning Date</p>
                        <p className="font-medium">
                          {new Date(purchase.last_earning_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredPurchases.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Purchases</p>
                <p className="text-2xl font-bold">{filteredPurchases.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-success">
                  ₹
                  {filteredPurchases
                    .reduce((sum, p) => sum + p.purchase_price, 0)
                    .toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earned by Users</p>
                <p className="text-2xl font-bold text-primary">
                  ₹
                  {filteredPurchases
                    .reduce((sum, p) => sum + p.total_earned, 0)
                    .toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Contracts</p>
                <p className="text-2xl font-bold">
                  {filteredPurchases.filter((p) => p.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
