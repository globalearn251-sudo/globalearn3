import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { referralApi, companyApi } from '@/db/api';
import { Users, Copy, IndianRupee } from 'lucide-react';
import type { Referral } from '@/types/types';

export default function TeamPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState({ totalReferrals: 0, totalCommission: 0 });
  const [loading, setLoading] = useState(true);
  const [commissionPercentage, setCommissionPercentage] = useState<number>(5);

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile) return;
    
    try {
      setLoading(true);
      const [referralList, referralStats, settings] = await Promise.all([
        referralApi.getUserReferrals(profile.id),
        referralApi.getReferralStats(profile.id),
        companyApi.getAllSettings(),
      ]);
      
      setReferrals(referralList);
      setStats(referralStats);
      
      // Get referral commission percentage from settings
      const commissionSetting = settings.find(s => s.key === 'referral_commission_percentage');
      if (commissionSetting) {
        setCommissionPercentage(parseFloat(commissionSetting.value) || 5);
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/signup?ref=${profile?.referral_code}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Copied!',
      description: 'Referral link copied to clipboard',
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">My Team</h1>
          <p className="text-muted-foreground">Invite friends and earn rewards</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Referral Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={`${window.location.origin}/signup?ref=${profile?.referral_code || ''}`}
                readOnly
                className="flex-1"
              />
              <Button onClick={copyReferralLink} size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Share this link with your friends to earn {commissionPercentage}% referral rewards
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{stats.totalReferrals}</p>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <IndianRupee className="h-8 w-8 mx-auto mb-2 text-success" />
                <p className="text-2xl font-bold">₹{stats.totalCommission.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Total Earned</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {referrals.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Referred Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {referrals.map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{referral.referred_user?.username || 'User'}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(referral.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="font-bold text-success">
                      ₹{referral.commission_earned.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Alert>
            <AlertDescription className="text-center">
              No referrals yet. Start sharing your referral link!
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
