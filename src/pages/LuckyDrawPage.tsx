import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { luckyDrawApi } from '@/db/api';
import { Trophy, Gift, Sparkles } from 'lucide-react';
import type { LuckyDrawHistory } from '@/types/types';

export default function LuckyDrawPage() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [canClaim, setCanClaim] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [history, setHistory] = useState<LuckyDrawHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalWon, setTotalWon] = useState(0);
  const [claimsLeft, setClaimsLeft] = useState(0);

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile) return;
    
    try {
      setLoading(true);
      
      const canClaimToday = await luckyDrawApi.canSpinToday(profile.id);
      setCanClaim(canClaimToday);
      setClaimsLeft(canClaimToday ? 1 : 0);
      
      const userHistory = await luckyDrawApi.getUserHistory(profile.id, 10);
      setHistory(userHistory);
      
      // Calculate total won
      const total = userHistory.reduce((sum, item) => sum + item.reward_amount, 0);
      setTotalWon(total);
    } catch (error) {
      console.error('Error loading lucky draw data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lucky draw data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!profile || !canClaim || claiming) return;

    try {
      setClaiming(true);
      
      // Call backend API to get the reward
      const result = await luckyDrawApi.spin(profile.id);
      
      // Refresh profile to get updated balance
      await refreshProfile();
      
      toast({
        title: 'Congratulations! 🎉',
        description: `You won ${result.reward_name}! ₹${result.reward_amount} has been added to your balance.`,
      });

      setCanClaim(false);
      setClaimsLeft(0);
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to claim reward',
        variant: 'destructive',
      });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Daily Reward</h1>
          <p className="text-muted-foreground">Claim your daily reward and win prizes!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Won</p>
                  <p className="text-xl font-bold">₹{totalWon.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Gift className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Claims Left</p>
                  <p className="text-xl font-bold">{claimsLeft}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Claim Reward Card */}
        <Card>
          <CardContent className="pt-6 pb-8">
            {loading ? (
              <div className="flex flex-col items-center gap-6 py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Loading daily reward...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 py-8">
                {/* Reward Icon */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                    <Gift className="h-16 w-16 text-white" />
                  </div>
                  {canClaim && (
                    <div className="absolute -top-2 -right-2">
                      <Sparkles className="h-8 w-8 text-yellow-500 animate-pulse" />
                    </div>
                  )}
                </div>

                {/* Message */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">
                    {canClaim ? 'Your Daily Reward is Ready!' : 'Come Back Tomorrow'}
                  </h3>
                  <p className="text-muted-foreground">
                    {canClaim 
                      ? 'Click the button below to claim your reward' 
                      : 'You have already claimed your reward today'}
                  </p>
                </div>

                {/* Claim Button */}
                <Button
                  onClick={handleClaim}
                  disabled={!canClaim || claiming}
                  size="lg"
                  className="w-full max-w-xs h-14 text-lg font-semibold"
                >
                  {claiming ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Claiming...
                    </>
                  ) : canClaim ? (
                    <>
                      <Gift className="mr-2 h-5 w-5" />
                      Claim Now
                    </>
                  ) : (
                    'Already Claimed Today'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* History */}
        {history.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Recent Rewards</h3>
              <div className="space-y-2">
                {history.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{item.reward_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="font-bold text-success">+₹{item.reward_amount.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
