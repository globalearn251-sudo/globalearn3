import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { productApi } from '@/db/api';
import { ShoppingCart, TrendingUp, Calendar, IndianRupee } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/types/types';

export default function ProductsPage() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productApi.getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (product: Product) => {
    if (!profile) return;

    if (profile.balance < product.price) {
      toast({
        title: 'Insufficient Balance',
        description: 'Please recharge your account to purchase this product',
        variant: 'destructive',
      });
      return;
    }

    try {
      setPurchasing(product.id);
      await productApi.purchaseProduct(profile.id, product.id);
      await refreshProfile();
      
      toast({
        title: 'Success!',
        description: `Successfully purchased ${product.name}`,
      });
    } catch (error: any) {
      toast({
        title: 'Purchase Failed',
        description: error.message || 'Failed to purchase product',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4 pb-20">
        <Skeleton className="h-8 w-48 bg-muted" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Investment Products</h1>
          <p className="text-muted-foreground">Choose the best investment plan for you</p>
        </div>

        {profile && (
          <Alert>
            <IndianRupee className="h-4 w-4" />
            <AlertDescription>
              Your Balance: <span className="font-bold">₹{profile.balance.toFixed(2)}</span>
            </AlertDescription>
          </Alert>
        )}

        {products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No products available at the moment
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                {product.image_url && (
                  <div className="w-full h-48 overflow-hidden bg-muted">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{product.name}</CardTitle>
                  {product.description && (
                    <CardDescription>{product.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Price</p>
                        <p className="font-bold text-lg">₹{product.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-success" />
                      <div>
                        <p className="text-xs text-muted-foreground">Daily Earning</p>
                        <p className="font-bold text-lg text-success">
                          ₹{product.daily_earning.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Contract Duration</p>
                      <p className="font-medium">{product.contract_days} days</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">Total Return</p>
                    <p className="text-xl font-bold text-primary">
                      ₹{(product.daily_earning * product.contract_days).toFixed(2)}
                    </p>
                    <p className="text-xs text-success">
                      ROI: {(((product.daily_earning * product.contract_days) / product.price - 1) * 100).toFixed(1)}%
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => handlePurchase(product)}
                    disabled={purchasing === product.id || !profile || profile.balance < product.price}
                    className="w-full"
                  >
                    {purchasing === product.id ? (
                      'Processing...'
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Purchase Now
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
