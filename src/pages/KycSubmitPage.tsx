import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { kycApi, storageApi } from '@/db/api';
import { prepareImageForUpload, generateStoragePath } from '@/lib/imageUtils';
import { Upload, Loader2, FileText } from 'lucide-react';

export default function KycSubmitPage() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(type);
      const preparedFile = await prepareImageForUpload(file);
      if (type === 'front') {
        setIdFront(preparedFile);
      } else {
        setIdBack(preparedFile);
      }
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
      setUploading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !idFront || !idBack) return;

    if (!bankName || !accountNumber || !accountHolderName || !ifscCode) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Upload ID images
      const frontPath = generateStoragePath(profile.id, 'kyc', `id_front_${idFront.name}`);
      const backPath = generateStoragePath(profile.id, 'kyc', `id_back_${idBack.name}`);
      
      const [frontUrl, backUrl] = await Promise.all([
        storageApi.uploadImage(idFront, frontPath),
        storageApi.uploadImage(idBack, backPath),
      ]);

      // Submit KYC with new fields
      await kycApi.submitKyc(
        profile.id,
        frontUrl,
        backUrl,
        bankName,
        accountNumber,
        accountHolderName,
        ifscCode,
        upiId || undefined
      );

      // Refresh profile to update KYC status
      await refreshProfile();

      toast({
        title: 'Success!',
        description: 'KYC documents submitted. Waiting for admin review.',
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit KYC',
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
          <h1 className="text-2xl font-bold">KYC Verification</h1>
          <p className="text-muted-foreground">Submit your documents for verification</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Identity Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>ID Front *</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'front')}
                    disabled={loading || uploading === 'front'}
                    className="hidden"
                    id="id-front"
                  />
                  <label htmlFor="id-front" className="cursor-pointer">
                    {uploading === 'front' ? (
                      <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                    ) : idFront ? (
                      <div>
                        <Upload className="h-8 w-8 mx-auto text-success" />
                        <p className="mt-2 text-sm font-medium">{idFront.name}</p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Upload ID Front</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>ID Back *</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'back')}
                    disabled={loading || uploading === 'back'}
                    className="hidden"
                    id="id-back"
                  />
                  <label htmlFor="id-back" className="cursor-pointer">
                    {uploading === 'back' ? (
                      <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                    ) : idBack ? (
                      <div>
                        <Upload className="h-8 w-8 mx-auto text-success" />
                        <p className="mt-2 text-sm font-medium">{idBack.name}</p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Upload ID Back</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Input
                  id="accountNumber"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                <Input
                  id="accountHolderName"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ifscCode">IFSC Code *</Label>
                <Input
                  id="ifscCode"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="e.g., SBIN0001234"
                  disabled={loading}
                  required
                  maxLength={11}
                />
                <p className="text-xs text-muted-foreground">
                  11-character bank IFSC code
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="upiId">UPI ID (Optional)</Label>
                <Input
                  id="upiId"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g., yourname@paytm"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Your UPI ID for faster payments
                </p>
              </div>

              <Alert>
                <AlertDescription>
                  Your documents will be reviewed by our admin team. This usually takes 1-2 business days.
                </AlertDescription>
              </Alert>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !idFront || !idBack || !bankName || !accountNumber || !accountHolderName || !ifscCode}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit KYC Documents'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
