import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { kycApi } from '@/db/api';
import { FileText, Check, X, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { KycSubmission } from '@/types/types';

export default function AdminKycPage() {
  const { toast } = useToast();
  const [pendingSubmissions, setPendingSubmissions] = useState<KycSubmission[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<KycSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingSubmission, setViewingSubmission] = useState<KycSubmission | null>(null);
  const [processing, setProcessing] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      console.log('Loading KYC submissions...');
      const [pending, all] = await Promise.all([
        kycApi.getPendingKycSubmissions(),
        kycApi.getAllKycSubmissions(),
      ]);
      console.log('Pending KYC:', pending);
      console.log('All KYC:', all);
      setPendingSubmissions(pending);
      setAllSubmissions(all);
    } catch (error: any) {
      console.error('Error loading KYC submissions:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      toast({
        title: 'Error',
        description: `Failed to load KYC submissions: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (submission: KycSubmission) => {
    setViewingSubmission(submission);
    setAdminNote(submission.admin_note || '');
  };

  const handleApprove = async () => {
    if (!viewingSubmission) return;

    try {
      setProcessing(true);
      await kycApi.approveKycSubmission(viewingSubmission.id, adminNote || undefined);
      
      toast({
        title: 'Success',
        description: 'KYC submission approved',
      });

      setViewingSubmission(null);
      setAdminNote('');
      await loadSubmissions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve submission',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!viewingSubmission) return;

    if (!adminNote.trim()) {
      toast({
        title: 'Note Required',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);
      await kycApi.rejectKycSubmission(viewingSubmission.id, adminNote);
      
      toast({
        title: 'Success',
        description: 'KYC submission rejected',
      });

      setViewingSubmission(null);
      setAdminNote('');
      await loadSubmissions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject submission',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const SubmissionCard = ({ submission }: { submission: KycSubmission }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{submission.user?.username || 'Unknown User'}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(submission.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Bank</p>
          <p className="font-medium">{submission.bank_name}</p>
        </div>
        <Badge
          variant={
            submission.status === 'approved'
              ? 'default'
              : submission.status === 'pending'
              ? 'secondary'
              : 'destructive'
          }
        >
          {submission.status}
        </Badge>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleView(submission)}
        >
          <Eye className="h-4 w-4 mr-1" />
          Review
        </Button>
      </div>
    </div>
  );

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
          <h1 className="text-3xl font-bold">KYC Verification</h1>
          <p className="text-muted-foreground">Review and approve KYC submissions</p>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <span className="font-bold">{pendingSubmissions.length} Pending</span>
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Submissions ({allSubmissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending KYC Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingSubmissions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending KYC submissions
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingSubmissions.map((submission) => (
                    <SubmissionCard key={submission.id} submission={submission} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All KYC Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {allSubmissions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No KYC submissions yet
                </p>
              ) : (
                <div className="space-y-3">
                  {allSubmissions.map((submission) => (
                    <SubmissionCard key={submission.id} submission={submission} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={!!viewingSubmission} onOpenChange={() => setViewingSubmission(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KYC Submission Review</DialogTitle>
            <DialogDescription>
              Review identity documents and bank details
            </DialogDescription>
          </DialogHeader>
          {viewingSubmission && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">{viewingSubmission.user?.username}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      viewingSubmission.status === 'approved'
                        ? 'default'
                        : viewingSubmission.status === 'pending'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {viewingSubmission.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bank Name</p>
                  <p className="font-medium">{viewingSubmission.bank_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Number</p>
                  <p className="font-medium">{viewingSubmission.account_number}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Account Holder Name</p>
                  <p className="font-medium">{viewingSubmission.account_holder_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">IFSC Code</p>
                  <p className="font-medium font-mono">{viewingSubmission.ifsc_code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">UPI ID</p>
                  <p className="font-medium">{viewingSubmission.upi_id || 'Not provided'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">ID Front</p>
                  <div className="border rounded-lg overflow-hidden bg-muted">
                    <img
                      src={viewingSubmission.id_front_url}
                      alt="ID Front"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">ID Back</p>
                  <div className="border rounded-lg overflow-hidden bg-muted">
                    <img
                      src={viewingSubmission.id_back_url}
                      alt="ID Back"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>

              {viewingSubmission.status === 'pending' && (
                <div className="space-y-2">
                  <Label htmlFor="adminNote">Admin Note (Optional for approval, Required for rejection)</Label>
                  <Textarea
                    id="adminNote"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Add notes about this submission..."
                    rows={3}
                  />
                </div>
              )}

              {viewingSubmission.admin_note && viewingSubmission.status !== 'pending' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Admin Note</p>
                  <div className="border rounded-lg p-3 bg-muted/50">
                    <p className="text-sm">{viewingSubmission.admin_note}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {viewingSubmission?.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={processing}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={processing}
                >
                  <Check className="mr-2 h-4 w-4" />
                  {processing ? 'Processing...' : 'Approve'}
                </Button>
              </>
            )}
            {viewingSubmission?.status !== 'pending' && (
              <Button variant="outline" onClick={() => setViewingSubmission(null)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
