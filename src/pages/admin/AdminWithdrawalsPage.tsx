import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { adminWithdrawalApi, withdrawalApi } from '@/db/api';
import { DollarSign, Check, X, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { WithdrawalRequest } from '@/types/types';

export default function AdminWithdrawalsPage() {
  const { toast } = useToast();
  const [pendingRequests, setPendingRequests] = useState<WithdrawalRequest[]>([]);
  const [allRequests, setAllRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingRequest, setViewingRequest] = useState<WithdrawalRequest | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      console.log('Loading withdrawal requests...');
      const [pending, all] = await Promise.all([
        withdrawalApi.getPendingWithdrawalRequests(),
        withdrawalApi.getAllWithdrawalRequests(),
      ]);
      console.log('Pending withdrawals:', pending);
      console.log('All withdrawals:', all);
      setPendingRequests(pending);
      setAllRequests(all);
    } catch (error: any) {
      console.error('Error loading withdrawal requests:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      toast({
        title: 'Error',
        description: `Failed to load withdrawal requests: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: WithdrawalRequest) => {
    try {
      setProcessing(true);
      await adminWithdrawalApi.approve(request.id);
      
      toast({
        title: 'Success',
        description: `Withdrawal of ₹{request.amount.toFixed(2)} approved`,
      });

      setViewingRequest(null);
      await loadRequests();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve request',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (request: WithdrawalRequest) => {
    try {
      setProcessing(true);
      await adminWithdrawalApi.reject(request.id, 'Rejected by admin');
      
      toast({
        title: 'Success',
        description: 'Withdrawal request rejected',
      });

      setViewingRequest(null);
      await loadRequests();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject request',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const RequestCard = ({ request }: { request: WithdrawalRequest }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{request.user?.username || 'Unknown User'}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(request.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Amount</p>
          <p className="text-xl font-bold">₹{request.amount.toFixed(2)}</p>
        </div>
        <Badge
          variant={
            request.status === 'approved'
              ? 'default'
              : request.status === 'pending'
              ? 'secondary'
              : 'destructive'
          }
        >
          {request.status}
        </Badge>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setViewingRequest(request)}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
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
          <h1 className="text-3xl font-bold">Withdrawal Requests</h1>
          <p className="text-muted-foreground">Review and process withdrawal requests</p>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          <span className="font-bold">{pendingRequests.length} Pending</span>
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Requests ({allRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Withdrawal Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending withdrawal requests
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <RequestCard key={request.id} request={request} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Withdrawal Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {allRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No withdrawal requests yet
                </p>
              ) : (
                <div className="space-y-3">
                  {allRequests.map((request) => (
                    <RequestCard key={request.id} request={request} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Request Dialog */}
      <Dialog open={!!viewingRequest} onOpenChange={() => setViewingRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Withdrawal Request Details</DialogTitle>
            <DialogDescription>
              Review bank details and process the withdrawal
            </DialogDescription>
          </DialogHeader>
          {viewingRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">{viewingRequest.user?.username}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-bold text-xl">₹{viewingRequest.amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      viewingRequest.status === 'approved'
                        ? 'default'
                        : viewingRequest.status === 'pending'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {viewingRequest.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="font-medium">
                    {new Date(viewingRequest.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Bank Details</p>
                <div className="border rounded-lg p-4 bg-muted/50">
                  <pre className="text-sm whitespace-pre-wrap">{viewingRequest.bank_details}</pre>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {viewingRequest?.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleReject(viewingRequest)}
                  disabled={processing}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApprove(viewingRequest)}
                  disabled={processing}
                >
                  <Check className="mr-2 h-4 w-4" />
                  {processing ? 'Processing...' : 'Approve & Process'}
                </Button>
              </>
            )}
            {viewingRequest?.status !== 'pending' && (
              <Button variant="outline" onClick={() => setViewingRequest(null)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
