import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Star, Globe, Palette } from "lucide-react";
import { toast } from "sonner";

interface BrandManagerProps {
  businessId: Id<"businesses">;
}

export function BrandManager({ businessId }: BrandManagerProps) {
  const brands = useQuery(api.brands.listBrands, { businessId });
  const createBrand = useMutation(api.brands.createBrand);
  const updateBrand = useMutation(api.brands.updateBrand);
  const deleteBrand = useMutation(api.brands.deleteBrand);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logoUrl: "",
    primaryColor: "#000000",
    secondaryColor: "#666666",
    website: "",
    isDefault: false,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      logoUrl: "",
      primaryColor: "#000000",
      secondaryColor: "#666666",
      website: "",
      isDefault: false,
    });
  };

  const handleCreate = async () => {
    try {
      await createBrand({
        businessId,
        ...formData,
      });
      toast.success("Brand created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to create brand");
    }
  };

  const handleEdit = (brand: any) => {
    setSelectedBrand(brand);
    setFormData({
      name: brand.name,
      description: brand.description || "",
      logoUrl: brand.logoUrl || "",
      primaryColor: brand.primaryColor || "#000000",
      secondaryColor: brand.secondaryColor || "#666666",
      website: brand.website || "",
      isDefault: brand.isDefault || false,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedBrand) return;

    try {
      await updateBrand({
        brandId: selectedBrand._id,
        ...formData,
      });
      toast.success("Brand updated successfully");
      setIsEditDialogOpen(false);
      setSelectedBrand(null);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to update brand");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBrand) return;

    try {
      await deleteBrand({ brandId: selectedBrand._id });
      toast.success("Brand deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedBrand(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete brand");
    }
  };

  const handleToggleActive = async (brand: any) => {
    try {
      await updateBrand({
        brandId: brand._id,
        isActive: !brand.isActive,
      });
      toast.success(`Brand ${brand.isActive ? "deactivated" : "activated"}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update brand status");
    }
  };

  if (brands === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading brands...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Brand Management</h2>
          <p className="text-muted-foreground">
            Manage multiple brands for your business
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Brand
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Brand</DialogTitle>
              <DialogDescription>
                Add a new brand to your business portfolio
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Brand Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter brand name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the brand"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-20"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="w-20"
                    />
                    <Input
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      placeholder="#666666"
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                />
                <Label htmlFor="isDefault">Set as default brand</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!formData.name}>
                Create Brand
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Brands List */}
      <ScrollArea className="h-[600px]">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {brands.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Palette className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No brands yet. Create your first brand to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            brands.map((brand: any) => (
              <Card key={brand._id} className="relative">
                {brand.isDefault && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="default" className="gap-1">
                      <Star className="h-3 w-3" />
                      Default
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start gap-4">
                    {brand.logoUrl ? (
                      <img
                        src={brand.logoUrl}
                        alt={brand.name}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div
                        className="h-12 w-12 rounded flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: brand.primaryColor }}
                      >
                        {brand.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{brand.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {brand.description || "No description"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <div
                      className="h-8 w-8 rounded border"
                      style={{ backgroundColor: brand.primaryColor }}
                      title="Primary Color"
                    />
                    <div
                      className="h-8 w-8 rounded border"
                      style={{ backgroundColor: brand.secondaryColor }}
                      title="Secondary Color"
                    />
                  </div>
                  {brand.website && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <a
                        href={brand.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline truncate"
                      >
                        {brand.website}
                      </a>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Badge variant={brand.isActive ? "default" : "secondary"}>
                      {brand.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(brand)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedBrand(brand);
                          setIsDeleteDialogOpen(true);
                        }}
                        disabled={brand.isDefault}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Brand</DialogTitle>
            <DialogDescription>
              Update brand information and settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Brand Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter brand name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the brand"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-logoUrl">Logo URL</Label>
              <Input
                id="edit-logoUrl"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-20"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    placeholder="#000000"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-secondaryColor">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-secondaryColor"
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="w-20"
                  />
                  <Input
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    placeholder="#666666"
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-website">Website</Label>
              <Input
                id="edit-website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
              />
              <Label htmlFor="edit-isDefault">Set as default brand</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.name}>
              Update Brand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the brand "{selectedBrand?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
