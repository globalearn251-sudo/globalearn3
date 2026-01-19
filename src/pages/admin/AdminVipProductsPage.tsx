import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { vipProductApi, storageApi } from '@/db/api';
import { prepareImageForUpload, generateStoragePath } from '@/lib/imageUtils';
import { Crown, Plus, Edit, Trash2, Upload, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import type { VipProduct, ProductStatus } from '@/types/types';
import { useAuth } from '@/contexts/AuthContext';

interface VipProductFormData {
  name: string;
  description: string;
  price: string;
  earnings: string;
  image: File | null;
  status: ProductStatus;
}

export default function AdminVipProductsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<VipProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<VipProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<VipProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<VipProductFormData>({
    name: '',
    description: '',
    price: '',
    earnings: '',
    image: null,
    status: 'active',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await vipProductApi.getAllVipProductsAdmin();
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

  const handleOpenDialog = (product?: VipProduct) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        earnings: product.earnings.toString(),
        image: null,
        status: product.status,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        earnings: '',
        image: null,
        status: 'active',
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      earnings: '',
      image: null,
      status: 'active',
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const preparedFile = await prepareImageForUpload(file);
      setFormData({ ...formData, image: preparedFile });
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
    if (!profile) return;

    const price = parseFloat(formData.price);
    const earnings = parseFloat(formData.earnings);

    if (isNaN(price) || price <= 0) {
      toast({
        title: 'Invalid Price',
        description: 'Please enter a valid price',
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(earnings) || earnings < 0) {
      toast({
        title: 'Invalid Earnings',
        description: 'Please enter valid earnings amount',
        variant: 'destructive',
      });
      return;
    }

    if (!editingProduct && !formData.image) {
      toast({
        title: 'Image Required',
        description: 'Please upload a product image',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      let imageUrl = editingProduct?.image_url || '';

      // Upload new image if provided
      if (formData.image) {
        const path = generateStoragePath(profile.id, 'vip_products', formData.image.name);
        imageUrl = await storageApi.uploadImage(formData.image, path);
      }

      const productData = {
        name: formData.name,
        description: formData.description,
        price,
        earnings,
        image_url: imageUrl,
        status: formData.status,
      };

      if (editingProduct) {
        await vipProductApi.updateVipProduct(editingProduct.id, productData);
        toast({
          title: 'Success',
          description: 'VIP product updated successfully',
        });
      } else {
        await vipProductApi.createVipProduct(productData);
        toast({
          title: 'Success',
          description: 'VIP product created successfully',
        });
      }

      handleCloseDialog();
      await loadProducts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save VIP product',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;

    try {
      setSaving(true);
      await vipProductApi.deleteVipProduct(deletingProduct.id);
      toast({
        title: 'Success',
        description: 'VIP product deleted successfully',
      });
      setDeletingProduct(null);
      await loadProducts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete VIP product',
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
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48 w-full bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">VIP Products Management</h1>
            <p className="text-muted-foreground">Manage instant earning products</p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add VIP Product
        </Button>
      </div>

      {/* Products List */}
      <div className="grid gap-4">
        {products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Crown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No VIP products yet</p>
              <Button className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Create First VIP Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          products.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-bold">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                      </div>
                      <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                        {product.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="text-lg font-bold">₹{product.price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Instant Earnings</p>
                        <p className="text-lg font-bold text-success">₹{product.earnings.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDialog(product)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeletingProduct(product)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit VIP Product' : 'Add VIP Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update VIP product details' : 'Create a new VIP product with instant earnings'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="earnings">Instant Earnings (₹) *</Label>
                <Input
                  id="earnings"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.earnings}
                  onChange={(e) => setFormData({ ...formData, earnings: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: ProductStatus) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Product Image {!editingProduct && '*'}</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                />
                <label htmlFor="image" className="cursor-pointer">
                  {uploading ? (
                    <Loader2 className="h-12 w-12 mx-auto animate-spin text-muted-foreground" />
                  ) : formData.image ? (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-primary" />
                      <p className="text-sm font-medium">{formData.image.name}</p>
                      <p className="text-xs text-muted-foreground">Click to change</p>
                    </div>
                  ) : editingProduct ? (
                    <div className="space-y-2">
                      <img src={editingProduct.image_url} alt="Current" className="h-32 mx-auto object-cover rounded" />
                      <p className="text-xs text-muted-foreground">Click to change image</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-sm">Click to upload image</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 1MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || uploading}>
                {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete VIP Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProduct?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
