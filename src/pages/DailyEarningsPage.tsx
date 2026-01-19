import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dailyEarningsApi, userProductApi } from '@/db/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, TrendingUp, Calendar, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { DailyEarning, UserProduct } from '@/types/types';
import { format } from 'date-fns';

export default function DailyEarningsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<DailyEarning[]>([]);
  const [activeProducts, setActiveProducts] = useState<UserProduct[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load daily earnings history
      const earningsData = await dailyEarningsApi.getUserDailyEarnings(user.id);
      setEarnings(earningsData);

      // Load active products
      const productsData = await userProductApi.getUserProducts(user.id);
      const active = productsData.filter(p => p.is_active);
      setActiveProducts(active);

      // Calculate total earnings
      const total = earningsData.reduce((sum, e) => sum + Number(e.amount), 0);
      setTotalEarnings(total);
    } catch (error) {
      console.error('Error loading earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-12 w-full bg-muted" />
          <Skeleton className="h-32 w-full bg-muted" />
          <Skeleton className="h-64 w-full bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Daily Earnings</h1>
          </div>

          {/* Total Earnings Card */}
          <Card className="bg-primary-foreground/10 border-primary-foreground/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-foreground/80">Total Earnings</p>
                  <p className="text-2xl font-bold text-primary-foreground">₹{totalEarnings.toFixed(2)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Active Products */}
        {activeProducts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Active Investments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted"
                >
                  <div className="flex items-center gap-3">
                    {product.product?.image_url && (
                      <img
                        src={product.product.image_url}
                        alt={product.product.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium">{product.product?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Daily: ₹{Number(product.daily_earning).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{product.days_remaining} days left</p>
                    <p className="text-xs text-muted-foreground">
                      Earned: ₹{Number(product.total_earned).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Earnings History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Earnings History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {earnings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No earnings yet</p>
                <p className="text-sm mt-1">Purchase a product to start earning daily</p>
              </div>
            ) : (
              <div className="space-y-2">
                {earnings.map((earning) => (
                  <div
                    key={earning.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Daily Earning</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(earning.earning_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">+₹{Number(earning.amount).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
