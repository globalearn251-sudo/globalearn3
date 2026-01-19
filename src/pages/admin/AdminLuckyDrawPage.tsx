import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { luckyDrawApi, adminLuckyDrawApi } from '@/db/api';
import { Gift, Plus, Trash2, Save } from 'lucide-react';
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
import type { LuckyDrawConfig } from '@/types/types';

export default function AdminLuckyDrawPage() {
  const { toast } = useToast();
  const [rewards, setRewards] = useState<LuckyDrawConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingReward, setDeletingReward] = useState<LuckyDrawConfig | null>(null);

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      setLoading(true);
      const data = await luckyDrawApi.getAllRewards();
      setRewards(data);
    } catch (error) {
      console.error('Error loading rewards:', error);
      toast({
        title: 'Error',
        description: 'Failed to load rewards',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddReward = () => {
    setRewards([
      ...rewards,
      {
        id: `temp-${Date.now()}`,
        reward_name: '',
        reward_amount: 0,
        probability: 0,
        is_active: true,
        created_at: new Date().toISOString(),
      } as LuckyDrawConfig,
    ]);
  };

  const handleUpdateReward = (index: number, field: keyof LuckyDrawConfig, value: any) => {
    const updated = [...rewards];
    updated[index] = { ...updated[index], [field]: value };
    setRewards(updated);
  };

  const handleDeleteReward = async () => {
    if (!deletingReward) return;

    // If it's a temporary reward (not saved yet), just remove from state
    if (deletingReward.id.startsWith('temp-')) {
      setRewards(rewards.filter((r) => r.id !== deletingReward.id));
      setDeletingReward(null);
      return;
    }

    try {
      await adminLuckyDrawApi.deleteReward(deletingReward.id);
      toast({
        title: 'Success',
        description: 'Reward deleted successfully',
      });
      setDeletingReward(null);
      await loadRewards();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete reward',
        variant: 'destructive',
      });
    }
  };

  const handleSaveAll = async () => {
    // Validate
    const totalProbability = rewards.reduce((sum, r) => sum + Number(r.probability), 0);
    if (Math.abs(totalProbability - 100) > 0.01) {
      toast({
        title: 'Validation Error',
        description: 'Total probability must equal 100%',
        variant: 'destructive',
      });
      return;
    }

    const hasEmpty = rewards.some((r) => !r.reward_name || r.reward_amount <= 0 || r.probability <= 0);
    if (hasEmpty) {
      toast({
        title: 'Validation Error',
        description: 'All rewards must have name, amount, and probability',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      // Separate new and existing rewards
      const newRewards = rewards.filter((r) => r.id.startsWith('temp-'));
      const existingRewards = rewards.filter((r) => !r.id.startsWith('temp-'));

      // Create new rewards
      for (const reward of newRewards) {
        await luckyDrawApi.createReward({
          reward_name: reward.reward_name,
          reward_amount: Number(reward.reward_amount),
          probability: Number(reward.probability),
          is_active: reward.is_active,
        });
      }

      // Update existing rewards
      for (const reward of existingRewards) {
        await luckyDrawApi.updateReward(reward.id, {
          reward_name: reward.reward_name,
          reward_amount: Number(reward.reward_amount),
          probability: Number(reward.probability),
          is_active: reward.is_active,
        });
      }

      toast({
        title: 'Success',
        description: 'Lucky draw rewards saved successfully',
      });

      await loadRewards();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save rewards',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
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

  const totalProbability = rewards.reduce((sum, r) => sum + Number(r.probability || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lucky Draw Configuration</h1>
          <p className="text-muted-foreground">Configure rewards and probabilities</p>
        </div>
        <Button onClick={handleAddReward}>
          <Plus className="mr-2 h-4 w-4" />
          Add Reward
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Reward Configuration</CardTitle>
            <div className="text-sm">
              Total Probability:{' '}
              <span
                className={`font-bold ${
                  Math.abs(totalProbability - 100) < 0.01
                    ? 'text-success'
                    : 'text-destructive'
                }`}
              >
                {totalProbability.toFixed(2)}%
              </span>
              {' / 100%'}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {rewards.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No rewards configured. Add your first reward to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rewards.map((reward, index) => (
                <div key={reward.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Reward #{index + 1}</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeletingReward(reward)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Reward Name *</Label>
                      <Input
                        value={reward.reward_name}
                        onChange={(e) => handleUpdateReward(index, 'reward_name', e.target.value)}
                        placeholder="e.g., ₹5 Bonus"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Amount (₹) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={reward.reward_amount}
                        onChange={(e) =>
                          handleUpdateReward(index, 'reward_amount', parseFloat(e.target.value) || 0)
                        }
                        placeholder="5.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Probability (%) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={reward.probability}
                        onChange={(e) =>
                          handleUpdateReward(index, 'probability', parseFloat(e.target.value) || 0)
                        }
                        placeholder="20.00"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`active-${reward.id}`}
                      checked={reward.is_active}
                      onChange={(e) => handleUpdateReward(index, 'is_active', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor={`active-${reward.id}`} className="cursor-pointer">
                      Active
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {rewards.length > 0 && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={loadRewards}>
            Reset Changes
          </Button>
          <Button onClick={handleSaveAll} disabled={saving} size="lg">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save All Rewards'}
          </Button>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingReward} onOpenChange={() => setDeletingReward(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reward</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingReward?.reward_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReward}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
