import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layouts/Header';
import { ImportantNotificationBanner } from '@/components/layouts/ImportantNotificationBanner';
import { companyApi, userProductApi, transactionApi, dailyEarningsApi } from '@/db/api';
import { Wallet, TrendingUp, Plus, ArrowUpRight, UserPlus, Headphones, Eye, History, Gift, Info, ShieldCheck, Crown } from 'lucide-react';
import type { UserProduct, Transaction, CompanySetting } from '@/types/types';

export default function HomePage() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bannerUrl, setBannerUrl] = useState('');
  const [companyNotice, setCompanyNotice] = useState('');
  const [companyDetails, setCompanyDetails] = useState('');
  const [supportTelegramLink, setSupportTelegramLink] = useState('');
  const [activeProducts, setActiveProducts] = useState<UserProduct[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (profile) {
      console.log('HomePage: Profile loaded, loading data...', { 
        id: profile.id, 
        role: profile.role,
        isAdmin: profile.role === 'admin'
      });
      loadData();
    } else {
      console.log('HomePage: No profile yet');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]); // Only depend on profile.id to avoid unnecessary re-renders

  const loadData = async () => {
    if (!profile) {
      console.log('HomePage: loadData called but no profile');
      setLoading(false); // Don't stay in loading state
      return;
    }
    
    console.log('HomePage: Starting to load data for user', profile.id, 'role:', profile.role);
    
    try {
      setLoading(true); // Set loading at start
      
      // Fetch all data in parallel immediately for fast UI display
      const [settings, products, transactions] = await Promise.all([
        companyApi.getAllSettings().catch((err) => {
          console.error('Error loading settings:', err);
          return [] as CompanySetting[];
        }),
        userProductApi.getActiveUserProducts(profile.id).catch((err) => {
          console.error('Error loading products:', err);
          return [];
        }),
        transactionApi.getUserTransactions(profile.id, 5).catch((err) => {
          console.error('Error loading transactions:', err);
          return [];
        }),
      ]);

      console.log('HomePage: Data loaded successfully', { 
        settings: settings.length, 
        products: products.length, 
        transactions: transactions.length,
        userRole: profile.role 
      });

      // Process settings
      settings.forEach((s: CompanySetting) => {
        if (s.key === 'banner_url') setBannerUrl(s.value);
        if (s.key === 'company_notice') setCompanyNotice(s.value);
        if (s.key === 'company_details') setCompanyDetails(s.value);
        if (s.key === 'support_telegram_link') setSupportTelegramLink(s.value);
      });

      setActiveProducts(products);
      setRecentTransactions(transactions);
      setLoading(false); // Show UI immediately
      
      console.log('HomePage: UI should now be visible for', profile.role, 'user');
      
      // Calculate daily earnings in background (non-blocking)
      // Temporarily disabled for debugging
      /*
      setTimeout(() => {
        dailyEarningsApi.calculateDailyEarnings()
          .then(() => {
            // Refresh profile to get updated balance and earnings
            return refreshProfile();
          })
          .catch((err) => {
            console.error('Daily earnings calculation error:', err);
            // Silent fail - don't disrupt user experience
          });
      }, 100);
      */
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-48 w-full bg-muted" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 bg-muted" />
          <Skeleton className="h-24 bg-muted" />
        </div>
        <Skeleton className="h-32 bg-muted" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <Header />

      {/* Company Banner */}
      {bannerUrl && (
        <div className="w-full h-48 overflow-hidden">
          <img
            src={bannerUrl}
            alt="Company Banner"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Company Notice */}
        {companyNotice && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>{companyNotice}</AlertDescription>
          </Alert>
        )}

        {/* Wallet Summary - New Design */}
        <div className="relative rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 p-6 text-white shadow-lg">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium opacity-90">Total Balance</span>
              <Eye className="h-4 w-4 opacity-70" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 gap-1"
              onClick={() => navigate('/profile')}
            >
              <History className="h-4 w-4" />
              <span className="text-sm">History</span>
            </Button>
          </div>

          {/* Balance Amount */}
          <div className="mb-6">
            <p className="text-4xl font-bold">
              ₹{profile?.balance?.toFixed(2) || '0.00'}
            </p>
          </div>

          {/* Withdrawable and Daily Earnings */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-xs opacity-80 mb-1">Withdrawable</p>
              <p className="text-xl font-bold">
                ₹{profile?.withdrawable_balance?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-xs opacity-80 mb-1">Total Product Earning</p>
              <p className="text-xl font-bold text-green-300">
                +₹{profile?.total_earnings?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>

      

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/recharge')}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <span className="text-sm font-medium">Recharge</span>
          </button>

          <button
            onClick={() => navigate('/withdrawal')}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center">
              <ArrowUpRight className="h-6 w-6 text-secondary" />
            </div>
            <span className="text-sm font-medium">Withdraw</span>
          </button>

          <button
            onClick={() => navigate('/daily-earnings')}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-sm font-medium">Earnings</span>
          </button>

          <button
            onClick={() => navigate('/team')}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-accent" />
            </div>
            <span className="text-sm font-medium">Invite</span>
          </button>
        </div>

        {/* Support Button - Separate Row */}
        <div className="flex justify-center">
          <button
            onClick={() => {
              if (supportTelegramLink) {
                window.open(supportTelegramLink, '_blank', 'noopener,noreferrer');
              } else {
                alert('Support link not configured. Please contact admin.');
              }
            }}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <Headphones className="h-6 w-6 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium">Support</span>
          </button>
        </div>

        {/* Important Notification Banner */}
        <ImportantNotificationBanner />

        {/* My Assets */}
        <Card>
          <CardHeader>
            <CardTitle>My Assets</CardTitle>
          </CardHeader>
          <CardContent>
            {activeProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No active investments</p>
                <Button onClick={() => navigate('/products')} className="mt-4">
                  Browse Products
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{product.product?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Daily: ₹{product.daily_earning.toFixed(2)} | Days left: {product.days_remaining}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-success">
                        ₹{product.total_earned.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Earned</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* VIP Products Promotion */}
        

        {/* Daily Reward */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Daily Reward
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Claim your daily reward once per day for bonus prizes!
            </p>
            <Button onClick={() => navigate('/lucky-draw')} className="w-full" variant="secondary">
              Claim Reward
            </Button>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium capitalize">{tx.type.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className={`font-bold ${tx.amount >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {tx.amount >= 0 ? '+' : ''}₹{tx.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => navigate('/profile')}
                variant="link"
                className="w-full mt-2"
              >
                View All Transactions
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Company Details */}
        {companyDetails && (
          <Card>
            <CardHeader>
              <CardTitle>About Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {companyDetails}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
