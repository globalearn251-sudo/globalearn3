import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { vipProductApi } from '@/db/api';
import { Crown, Sparkles, TrendingUp, ShoppingCart } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { VipProduct } from '@/types/types';

export default function VipProductsPage() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<VipProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<VipProduct | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await vipProductApi.getAllVipProducts();
      setProducts(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load VIP products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!profile || !selectedProduct) return;

    if (profile.balance < selectedProduct.price) {
      toast({
        title: 'Insufficient Balance',
        description: 'Please recharge your account to purchase this product',
        variant: 'destructive',
      });
      return;
    }

    try {
      setPurchasing(true);
      const result = await vipProductApi.purchaseVipProduct(profile.id, selectedProduct.id);
      
      toast({
        title: 'Purchase Successful! 🎉',
        description: `You received ₹${result.earnings_received.toFixed(2)} instantly!`,
      });

      await refreshProfile();
      setSelectedProduct(null);
    } catch (error: any) {
      toast({
        title: 'Purchase Failed',
        description: error.message || 'Failed to purchase VIP product',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-48 bg-muted" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">VIP Products</h1>
            <p className="text-muted-foreground">Instant earnings on purchase</p>
          </div>
        </div>

        {/* Balance Card */}
        {profile && (
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-3xl font-bold">₹{profile.balance.toFixed(2)}</p>
                </div>
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Grid */}
        {products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Crown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No VIP products available at the moment</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-3 right-3 bg-yellow-500 text-white">
                    <Crown className="h-3 w-3 mr-1" />
                    VIP
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{product.name}</span>
                    <span className="text-2xl font-bold text-primary">₹{product.price.toFixed(2)}</span>
                  </CardTitle>
                  <CardDescription>{product.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-success" />
                      <span className="font-medium">Instant Earnings</span>
                    </div>
                    <span className="text-xl font-bold text-success">₹{product.earnings.toFixed(2)}</span>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Buy Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              Review your VIP product purchase details
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div>
                  <p className="font-bold text-lg">{selectedProduct.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                </div>
              </div>
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product Price</span>
                  <span className="font-bold">₹{selectedProduct.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-success">
                  <span className="font-medium">Instant Earnings</span>
                  <span className="font-bold">+₹{selectedProduct.earnings.toFixed(2)}</span>
                </div>
                
              </div>
              {profile && profile.balance < selectedProduct.price && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive font-medium">
                    Insufficient balance. Please recharge your account.
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProduct(null)}>
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={purchasing || (!!profile && !!selectedProduct && profile.balance < selectedProduct.price)}
            >
              {purchasing ? 'Processing...' : 'Confirm Purchase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
