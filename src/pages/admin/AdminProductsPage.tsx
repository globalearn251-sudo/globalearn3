import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { productApi, storageApi } from '@/db/api';
import { prepareImageForUpload, generateStoragePath } from '@/lib/imageUtils';
import { Package, Plus, Edit, Trash2, Upload, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import type { Product } from '@/types/types';
import type { ProductStatus } from '@/types/types';

export default function AdminProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [dailyEarning, setDailyEarning] = useState('');
  const [contractDays, setContractDays] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productApi.getAllProductsAdmin();
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

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setDailyEarning('');
    setContractDays('');
    setImageFile(null);
    setImageUrl('');
    setEditingProduct(null);
  };

  const handleCreate = () => {
    resetForm();
    setShowDialog(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || '');
    setPrice(product.price.toString());
    setDailyEarning(product.daily_earning.toString());
    setContractDays(product.contract_days.toString());
    setImageUrl(product.image_url || '');
    setShowDialog(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const preparedFile = await prepareImageForUpload(file);
      setImageFile(preparedFile);
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

  const handleSave = async () => {
    if (!name || !price || !dailyEarning || !contractDays) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      let finalImageUrl = imageUrl;

      // Upload new image if selected
      if (imageFile) {
        const path = generateStoragePath('admin', 'products', imageFile.name);
        finalImageUrl = await storageApi.uploadImage(imageFile, path);
      }

      const productData = {
        name,
        description: description || null,
        price: parseFloat(price),
        daily_earning: parseFloat(dailyEarning),
        contract_days: parseInt(contractDays),
        image_url: finalImageUrl || null,
        status: 'active' as ProductStatus,
      };

      if (editingProduct) {
        await productApi.updateProduct(editingProduct.id, productData);
        toast({
          title: 'Success',
          description: 'Product updated successfully',
        });
      } else {
        await productApi.createProduct(productData);
        toast({
          title: 'Success',
          description: 'Product created successfully',
        });
      }

      setShowDialog(false);
      resetForm();
      await loadProducts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save product',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;

    try {
      await productApi.deleteProduct(deletingProduct.id);
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
      setDeletingProduct(null);
      await loadProducts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete product',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const newStatus = product.status === 'active' ? ('inactive' as ProductStatus) : ('active' as ProductStatus);
      await productApi.updateProduct(product.id, { status: newStatus });
      toast({
        title: 'Success',
        description: `Product ${newStatus === 'active' ? 'activated' : 'deactivated'}`,
      });
      await loadProducts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update product',
        variant: 'destructive',
      });
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
          <h1 className="text-3xl font-bold">Product Management</h1>
          <p className="text-muted-foreground">Create and manage investment products</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Product
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id}>
            {product.image_url && (
              <div className="w-full h-48 overflow-hidden rounded-t-lg bg-muted">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                  {product.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {product.description && (
                <p className="text-sm text-muted-foreground">{product.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Price</p>
                  <p className="font-bold">₹{product.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Daily Earning</p>
                  <p className="font-bold text-success">₹{product.daily_earning.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Contract Days</p>
                  <p className="font-bold">{product.contract_days}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Return</p>
                  <p className="font-bold text-primary">
                    ₹{(product.daily_earning * product.contract_days).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleActive(product)}
                  className="flex-1"
                >
                  {product.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(product)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeletingProduct(product)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No products yet. Create your first product to get started.</p>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Create Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update product details' : 'Add a new investment product'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Premium Investment Plan"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Product description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="100.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyEarning">Daily Earning ($) *</Label>
                <Input
                  id="dailyEarning"
                  type="number"
                  step="0.01"
                  min="0"
                  value={dailyEarning}
                  onChange={(e) => setDailyEarning(e.target.value)}
                  placeholder="5.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractDays">Contract Days *</Label>
                <Input
                  id="contractDays"
                  type="number"
                  min="1"
                  value={contractDays}
                  onChange={(e) => setContractDays(e.target.value)}
                  placeholder="30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Product Image</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                  id="product-image"
                />
                <label htmlFor="product-image" className="cursor-pointer">
                  {uploading ? (
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                  ) : imageFile ? (
                    <div>
                      <Upload className="h-8 w-8 mx-auto text-success" />
                      <p className="mt-2 text-sm font-medium">{imageFile.name}</p>
                    </div>
                  ) : imageUrl ? (
                    <div>
                      <img src={imageUrl} alt="Current" className="h-32 mx-auto object-contain mb-2" />
                      <p className="text-sm text-muted-foreground">Click to change image</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">Click to upload image</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || uploading}>
              {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProduct?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
