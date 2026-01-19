import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { companyApi, rechargeApi, storageApi } from '@/db/api';
import { prepareImageForUpload, generateStoragePath } from '@/lib/imageUtils';
import { Upload, Loader2, QrCode } from 'lucide-react';

export default function RechargePage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadQrCode();
  }, []);

  const loadQrCode = async () => {
    try {
      const setting = await companyApi.getSetting('recharge_qr_code_url');
      if (setting) {
        setQrCodeUrl(setting.value);
      }
    } catch (error) {
      console.error('Error loading QR code:', error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const preparedFile = await prepareImageForUpload(file);
      setScreenshot(preparedFile);
      toast({
        title: 'Image Ready',
        description: `File size: ${(preparedFile.size / 1024).toFixed(2)} KB`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !screenshot) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Upload screenshot
      const path = generateStoragePath(profile.id, 'recharge', screenshot.name);
      const screenshotUrl = await storageApi.uploadImage(screenshot, path);

      // Create recharge request
      await rechargeApi.createRechargeRequest(
        profile.id, 
        amountNum, 
        screenshotUrl,
        transactionId.trim() || undefined
      );

      toast({
        title: 'Success!',
        description: 'Recharge request submitted. Waiting for admin approval.',
      });

      navigate('/profile');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit recharge request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Recharge Account</h1>
          <p className="text-muted-foreground">Add funds to your wallet</p>
        </div>

        {qrCodeUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Payment QR Code
              </CardTitle>
              <CardDescription>Scan this QR code to make payment</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <img src={qrCodeUrl} alt="Payment QR Code" className="w-64 h-64 object-contain" />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recharge Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
                <Input
                  id="transactionId"
                  type="text"
                  placeholder="Enter transaction ID (if available)"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the transaction ID from your payment app if available
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="screenshot">Payment Screenshot *</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Input
                    id="screenshot"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={loading || uploading}
                    className="hidden"
                  />
                  <label htmlFor="screenshot" className="cursor-pointer">
                    {uploading ? (
                      <Loader2 className="h-12 w-12 mx-auto animate-spin text-muted-foreground" />
                    ) : screenshot ? (
                      <div>
                        <Upload className="h-12 w-12 mx-auto text-success" />
                        <p className="mt-2 text-sm font-medium">{screenshot.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(screenshot.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Click to upload payment screenshot
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  After submitting, please wait for admin approval. Your balance will be updated once approved.
                </AlertDescription>
              </Alert>

              <Button type="submit" className="w-full" disabled={loading || !screenshot || !amount}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Recharge Request'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
