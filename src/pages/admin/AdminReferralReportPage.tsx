import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { referralApi } from '@/db/api';
import { Users, Search, IndianRupee, TrendingUp, UserPlus } from 'lucide-react';
import type { Referral } from '@/types/types';

export default function AdminReferralReportPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [filteredReferrals, setFilteredReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadReferrals();
  }, []);

  useEffect(() => {
    filterReferrals();
  }, [searchTerm, referrals]);

  const loadReferrals = async () => {
    try {
      setLoading(true);
      const data = await referralApi.getAllReferrals();
      setReferrals(data);
      setFilteredReferrals(data);
    } catch (error) {
      console.error('Error loading referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReferrals = () => {
    if (!searchTerm) {
      setFilteredReferrals(referrals);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = referrals.filter(
      (referral) =>
        referral.referrer?.username?.toLowerCase().includes(term) ||
        referral.referred_user?.username?.toLowerCase().includes(term)
    );
    setFilteredReferrals(filtered);
  };

  const calculateStats = () => {
    const totalCommission = filteredReferrals.reduce(
      (sum, r) => sum + r.commission_earned,
      0
    );
    const uniqueReferrers = new Set(filteredReferrals.map((r) => r.referrer_id)).size;
    const avgCommission = filteredReferrals.length > 0 
      ? totalCommission / filteredReferrals.length 
      : 0;

    return {
      totalReferrals: filteredReferrals.length,
      totalCommission,
      uniqueReferrers,
      avgCommission,
    };
  };

  const stats = calculateStats();

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
          <h1 className="text-3xl font-bold">Referral Report</h1>
          <p className="text-muted-foreground">View all referral activities and commissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <p className="text-2xl font-bold">{referrals.length}</p>
            <p className="text-xs text-muted-foreground">Total Referrals</p>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <UserPlus className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-2xl font-bold">{stats.totalReferrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <IndianRupee className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Total Commission</p>
                <p className="text-2xl font-bold text-success">
                  ₹{stats.totalCommission.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Active Referrers</p>
                <p className="text-2xl font-bold">{stats.uniqueReferrers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Commission</p>
                <p className="text-2xl font-bold">₹{stats.avgCommission.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by referrer or referred user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Referrals List */}
      {filteredReferrals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {searchTerm ? 'No referrals found matching your search' : 'No referrals yet'}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Referral Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredReferrals.map((referral) => (
                <div
                  key={referral.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    {/* Referrer Info */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Referrer</p>
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold">
                            {referral.referrer?.username || 'Unknown User'}
                          </p>
                          {referral.referrer?.email && (
                            <p className="text-xs text-muted-foreground">
                              {referral.referrer.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Referred User Info */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Referred User</p>
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                          <UserPlus className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <p className="font-bold">
                            {referral.referred_user?.username || 'Unknown User'}
                          </p>
                          {referral.referred_user?.email && (
                            <p className="text-xs text-muted-foreground">
                              {referral.referred_user.email}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Joined:{' '}
                            {referral.referred_user?.created_at
                              ? new Date(referral.referred_user.created_at).toLocaleDateString()
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Commission & Date Info */}
                    <div className="flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Commission Earned</p>
                        <div className="flex items-center gap-1 mt-1">
                          <IndianRupee className="h-4 w-4 text-success" />
                          <p className="text-xl font-bold text-success">
                            ₹{referral.commission_earned.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">Referral Date</p>
                        <p className="text-sm font-medium">
                          {new Date(referral.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {Math.floor(
                            (Date.now() - new Date(referral.created_at).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}{' '}
                          days ago
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Referrers */}
      {filteredReferrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(() => {
                // Group by referrer and calculate totals
                const referrerMap = new Map<
                  string,
                  { username: string; email: string; count: number; commission: number }
                >();

                filteredReferrals.forEach((ref) => {
                  const id = ref.referrer_id;
                  const existing = referrerMap.get(id);
                  if (existing) {
                    existing.count += 1;
                    existing.commission += ref.commission_earned;
                  } else {
                    referrerMap.set(id, {
                      username: ref.referrer?.username || 'Unknown',
                      email: ref.referrer?.email || '',
                      count: 1,
                      commission: ref.commission_earned,
                    });
                  }
                });

                // Convert to array and sort by commission
                const topReferrers = Array.from(referrerMap.values())
                  .sort((a, b) => b.commission - a.commission)
                  .slice(0, 5);

                return topReferrers.map((referrer, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-bold">{referrer.username}</p>
                        {referrer.email && (
                          <p className="text-xs text-muted-foreground">{referrer.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success">
                        ₹{referrer.commission.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {referrer.count} referral{referrer.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
