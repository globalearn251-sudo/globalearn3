import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert, CheckCircle, Clock, XCircle } from 'lucide-react';

interface KycGateProps {
  children: React.ReactNode;
}

export default function KycGate({ children }: KycGateProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // If no profile, show nothing (auth will handle redirect)
  if (!profile) {
    return null;
  }

  // If KYC is approved, show children (normal app)
  if (profile.kyc_status === 'approved') {
    return <>{children}</>;
  }

  // If KYC is pending, show waiting message
  if (profile.kyc_status === 'pending') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl">KYC Verification Pending</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Your KYC verification is under review. Please wait for admin approval.
              </AlertDescription>
            </Alert>
            <p className="text-center text-muted-foreground">
              You will be able to access all features once your KYC is approved by the admin.
            </p>
            <div className="text-center text-sm text-muted-foreground">
              This usually takes 24-48 hours
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If KYC is rejected, show rejection message with option to resubmit
  if (profile.kyc_status === 'rejected') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">KYC Verification Rejected</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Your KYC verification was rejected. Please submit again with correct information.
              </AlertDescription>
            </Alert>
            <p className="text-center text-muted-foreground">
              You need to complete KYC verification to access all features.
            </p>
            <Button 
              onClick={() => navigate('/kyc-submit')} 
              className="w-full"
              size="lg"
            >
              Submit KYC Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If KYC is null (not submitted), show requirement message
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Complete KYC Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              You must complete KYC verification before using the platform.
            </AlertDescription>
          </Alert>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Why KYC is required:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Secure your account</li>
              <li>Enable withdrawals</li>
              <li>Comply with regulations</li>
              <li>Protect against fraud</li>
            </ul>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">What you'll need:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Government-issued ID (front & back)</li>
              <li>Bank account details</li>
            </ul>
          </div>
          <Button 
            onClick={() => navigate('/kyc-submit')} 
            className="w-full"
            size="lg"
          >
            <CheckCircle className="mr-2 h-5 w-5" />
            Complete KYC Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
