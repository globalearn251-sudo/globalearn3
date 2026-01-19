import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { companyApi, storageApi } from '@/db/api';
import { prepareImageForUpload, generateStoragePath } from '@/lib/imageUtils';
import { Settings, Upload, Loader2, Save } from 'lucide-react';

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  // Settings state
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [rechargeQrUrl, setRechargeQrUrl] = useState('');
  const [rechargeQrFile, setRechargeQrFile] = useState<File | null>(null);
  const [companyNotice, setCompanyNotice] = useState('');
  const [companyDetails, setCompanyDetails] = useState('');
  const [referralCommission, setReferralCommission] = useState('5');
  const [minWithdrawalAmount, setMinWithdrawalAmount] = useState('500');
  const [supportTelegramLink, setSupportTelegramLink] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await companyApi.getAllSettings();
      
      settings.forEach((s) => {
        if (s.key === 'banner_url') setBannerUrl(s.value);
        if (s.key === 'recharge_qr_code_url') setRechargeQrUrl(s.value);
        if (s.key === 'company_notice') setCompanyNotice(s.value);
        if (s.key === 'company_details') setCompanyDetails(s.value);
        if (s.key === 'referral_commission_percentage') setReferralCommission(s.value);
        if (s.key === 'min_withdrawal_amount') setMinWithdrawalAmount(s.value);
        if (s.key === 'support_telegram_link') setSupportTelegramLink(s.value);
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'qr') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(type);
      const preparedFile = await prepareImageForUpload(file);
      
      if (type === 'banner') {
        setBannerFile(preparedFile);
      } else {
        setRechargeQrFile(preparedFile);
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

  const handleSave = async () => {
    try {
      setSaving(true);

      let finalBannerUrl = bannerUrl;
      let finalQrUrl = rechargeQrUrl;

      // Upload banner if new file selected
      if (bannerFile) {
        const path = generateStoragePath('admin', 'company', bannerFile.name);
        finalBannerUrl = await storageApi.uploadImage(bannerFile, path);
      }

      // Upload QR code if new file selected
      if (rechargeQrFile) {
        const path = generateStoragePath('admin', 'company', rechargeQrFile.name);
        finalQrUrl = await storageApi.uploadImage(rechargeQrFile, path);
      }

      // Update all settings
      await Promise.all([
        companyApi.updateSetting('banner_url', finalBannerUrl),
        companyApi.updateSetting('recharge_qr_code_url', finalQrUrl),
        companyApi.updateSetting('company_notice', companyNotice),
        companyApi.updateSetting('company_details', companyDetails),
        companyApi.updateSetting('referral_commission_percentage', referralCommission),
        companyApi.updateSetting('min_withdrawal_amount', minWithdrawalAmount),
        companyApi.updateSetting('support_telegram_link', supportTelegramLink),
      ]);

      toast({
        title: 'Success',
        description: 'Company settings updated successfully',
      });

      setBannerFile(null);
      setRechargeQrFile(null);
      await loadSettings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings',
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Company Settings</h1>
          <p className="text-muted-foreground">Manage company information and branding</p>
        </div>
        <Settings className="h-8 w-8 text-muted-foreground" />
      </div>

      <div className="grid gap-6">
        {/* Banner Image */}
        <Card>
          <CardHeader>
            <CardTitle>Company Banner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bannerUrl && !bannerFile && (
              <div className="border rounded-lg overflow-hidden">
                <img src={bannerUrl} alt="Current Banner" className="w-full h-48 object-cover" />
              </div>
            )}
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'banner')}
                disabled={uploading === 'banner'}
                className="hidden"
                id="banner-upload"
              />
              <label htmlFor="banner-upload" className="cursor-pointer">
                {uploading === 'banner' ? (
                  <Loader2 className="h-12 w-12 mx-auto animate-spin text-muted-foreground" />
                ) : bannerFile ? (
                  <div>
                    <Upload className="h-12 w-12 mx-auto text-success" />
                    <p className="mt-2 text-sm font-medium">{bannerFile.name}</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Click to upload new banner image
                    </p>
                  </div>
                )}
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Recharge QR Code */}
        <Card>
          <CardHeader>
            <CardTitle>Recharge QR Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rechargeQrUrl && !rechargeQrFile && (
              <div className="border rounded-lg overflow-hidden flex justify-center p-4 bg-muted">
                <img src={rechargeQrUrl} alt="Current QR Code" className="w-64 h-64 object-contain" />
              </div>
            )}
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'qr')}
                disabled={uploading === 'qr'}
                className="hidden"
                id="qr-upload"
              />
              <label htmlFor="qr-upload" className="cursor-pointer">
                {uploading === 'qr' ? (
                  <Loader2 className="h-12 w-12 mx-auto animate-spin text-muted-foreground" />
                ) : rechargeQrFile ? (
                  <div>
                    <Upload className="h-12 w-12 mx-auto text-success" />
                    <p className="mt-2 text-sm font-medium">{rechargeQrFile.name}</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Click to upload new QR code
                    </p>
                  </div>
                )}
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Company Notice */}
        <Card>
          <CardHeader>
            <CardTitle>Company Notice</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={companyNotice}
              onChange={(e) => setCompanyNotice(e.target.value)}
              placeholder="Enter company notice or announcement..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Company Details */}
        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={companyDetails}
              onChange={(e) => setCompanyDetails(e.target.value)}
              placeholder="Enter company description and details..."
              rows={6}
            />
          </CardContent>
        </Card>

        {/* Referral Commission */}
        <Card>
          <CardHeader>
            <CardTitle>Referral Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="referralCommission">Commission Percentage (%)</Label>
              <Input
                id="referralCommission"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={referralCommission}
                onChange={(e) => setReferralCommission(e.target.value)}
                placeholder="Enter commission percentage (e.g., 5)"
              />
              <p className="text-sm text-muted-foreground">
                Percentage of product price paid to referrer when their referred user makes a purchase
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Minimum Withdrawal Amount */}
        <Card>
          <CardHeader>
            <CardTitle>Minimum Withdrawal Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="minWithdrawalAmount">Minimum Amount (₹)</Label>
              <Input
                id="minWithdrawalAmount"
                type="number"
                min="0"
                step="0.01"
                value={minWithdrawalAmount}
                onChange={(e) => setMinWithdrawalAmount(e.target.value)}
                placeholder="Enter minimum withdrawal amount (e.g., 500)"
              />
              <p className="text-sm text-muted-foreground">
                Users must have at least this amount in their withdrawable balance to submit a withdrawal request
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Support Telegram Link */}
        <Card>
          <CardHeader>
            <CardTitle>Support Telegram Link</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="supportTelegramLink">Telegram Channel/Group Link</Label>
              <Input
                id="supportTelegramLink"
                type="url"
                value={supportTelegramLink}
                onChange={(e) => setSupportTelegramLink(e.target.value)}
                placeholder="Enter Telegram link (e.g., https://t.me/yoursupport)"
              />
              <p className="text-sm text-muted-foreground">
                This link will be displayed in the user dashboard support section. Users can click to join your Telegram support channel.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || !!uploading} size="lg">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
