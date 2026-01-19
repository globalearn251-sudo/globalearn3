import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/db/supabase';
import { Play, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface EarningsResult {
  success: boolean;
  message: string;
  processed: number;
  deactivated: number;
  errors: string[];
}

export default function AdminEarningsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EarningsResult | null>(null);

  const triggerDailyEarnings = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('daily-earnings', {
        body: {},
      });

      if (error) {
        const errorMsg = await error?.context?.text();
        console.error('Edge function error in daily-earnings:', errorMsg || error?.message);
        throw new Error(errorMsg || error.message || 'Failed to trigger daily earnings');
      }

      setResult(data);

      if (data.success) {
        toast({
          title: 'Success',
          description: data.message,
        });
      } else {
        toast({
          title: 'Partial Success',
          description: `${data.message}. Check errors below.`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error triggering daily earnings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to trigger daily earnings',
        variant: 'destructive',
      });
      setResult({
        success: false,
        message: error.message,
        processed: 0,
        deactivated: 0,
        errors: [error.message],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Daily Earnings Management</h1>
        <p className="text-muted-foreground mt-2">
          Manually trigger daily earnings calculation or view automation status
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manual Trigger</CardTitle>
          <CardDescription>
            Run the daily earnings calculation immediately. This will process all active investment products.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <Button
              onClick={triggerDailyEarnings}
              disabled={loading}
              size="lg"
              className="min-w-[200px]"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Trigger Daily Earnings
                </>
              )}
            </Button>
            <div className="flex-1 text-sm text-muted-foreground">
              <p className="font-medium mb-1">What this does:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Finds all active investment products</li>
                <li>Adds daily earnings to user balances</li>
                <li>Creates transaction records</li>
                <li>Updates days remaining</li>
                <li>Deactivates completed products</li>
              </ul>
            </div>
          </div>

          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {result.success ? 'Success' : 'Completed with Errors'}
              </AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2">
                  <p>{result.message}</p>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="bg-background/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Processed</p>
                      <p className="text-2xl font-bold">{result.processed}</p>
                    </div>
                    <div className="bg-background/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Deactivated</p>
                      <p className="text-2xl font-bold">{result.deactivated}</p>
                    </div>
                  </div>
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium text-sm mb-2">Errors:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {result.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Automation Setup</CardTitle>
          <CardDescription>
            Configure automatic daily earnings calculation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Cron Schedule Required</AlertTitle>
            <AlertDescription>
              <p className="mb-3">
                To automate daily earnings, you need to set up a cron trigger in your Supabase dashboard.
              </p>
              <div className="space-y-2 text-sm">
                <p className="font-medium">Steps:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Go to Supabase Dashboard → Edge Functions</li>
                  <li>Find the "daily-earnings" function</li>
                  <li>Click "Add Cron Trigger"</li>
                  <li>Set schedule: <code className="bg-muted px-2 py-1 rounded">0 0 * * *</code> (daily at midnight UTC)</li>
                  <li>Save the trigger</li>
                </ol>
                <p className="mt-3 text-muted-foreground">
                  See <code>DAILY_EARNINGS_SETUP.md</code> for detailed instructions.
                </p>
              </div>
            </AlertDescription>
          </Alert>

          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-medium">Common Cron Schedules:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <code className="bg-muted px-2 py-1 rounded">0 0 * * *</code>
                <span className="text-muted-foreground">Every day at midnight UTC</span>
              </div>
              <div className="flex justify-between items-center">
                <code className="bg-muted px-2 py-1 rounded">0 2 * * *</code>
                <span className="text-muted-foreground">Every day at 2:00 AM UTC</span>
              </div>
              <div className="flex justify-between items-center">
                <code className="bg-muted px-2 py-1 rounded">0 12 * * *</code>
                <span className="text-muted-foreground">Every day at noon UTC</span>
              </div>
              <div className="flex justify-between items-center">
                <code className="bg-muted px-2 py-1 rounded">0 */6 * * *</code>
                <span className="text-muted-foreground">Every 6 hours</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Testing & Monitoring</CardTitle>
          <CardDescription>
            Best practices for testing and monitoring daily earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Before Going Live:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                <li>Test with a few sample products first</li>
                <li>Verify balances update correctly</li>
                <li>Check transaction records are created</li>
                <li>Confirm products deactivate when complete</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Monitoring:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                <li>Check Supabase Edge Function logs daily</li>
                <li>Monitor success rate and errors</li>
                <li>Verify processed counts match expectations</li>
                <li>Review user complaints about missing earnings</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Troubleshooting:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                <li>If function fails, run manually to catch up</li>
                <li>Check database for data inconsistencies</li>
                <li>Verify service role key is valid</li>
                <li>Review error messages in function logs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
