import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Upload, Image, FileText, Type, Trash2 } from "lucide-react";

interface AssetLibraryProps {
  businessId: Id<"businesses">;
  brandId?: Id<"brands">;
}

export function AssetLibrary({ businessId, brandId }: AssetLibraryProps) {
  const assets = useQuery(api.branding.getBrandAssets, { businessId, brandId });
  const uploadAsset = useMutation(api.branding.uploadBrandAsset);
  const deleteAsset = useMutation(api.branding.deleteBrandAsset);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [uploadForm, setUploadForm] = useState({
    name: "",
    type: "image" as "logo" | "icon" | "font" | "image" | "document",
    url: "",
    tags: "",
  });

  const handleUpload = async () => {
    if (!uploadForm.name || !uploadForm.url) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await uploadAsset({
        businessId,
        brandId,
        name: uploadForm.name,
        type: uploadForm.type,
        url: uploadForm.url,
        tags: uploadForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      toast.success("Asset uploaded successfully");
      setIsUploadOpen(false);
      setUploadForm({ name: "", type: "image", url: "", tags: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to upload asset");
    }
  };

  const handleDelete = async (assetId: Id<"brandAssets">) => {
    try {
      await deleteAsset({ assetId });
      toast.success("Asset deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete asset");
    }
  };

  const filteredAssets = assets?.filter(
    (asset: any) => filterType === "all" || asset.type === filterType
  );

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "logo":
      case "icon":
        return <Image className="h-4 w-4" />;
      case "font":
        return <Type className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      default:
        return <Image className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assets</SelectItem>
              <SelectItem value="logo">Logos</SelectItem>
              <SelectItem value="icon">Icons</SelectItem>
              <SelectItem value="font">Fonts</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Asset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Brand Asset</DialogTitle>
              <DialogDescription>Add a new asset to your brand library</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="asset-name">Asset Name *</Label>
                <Input
                  id="asset-name"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  placeholder="e.g., Primary Logo"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="asset-type">Type *</Label>
                <Select
                  value={uploadForm.type}
                  onValueChange={(value: any) => setUploadForm({ ...uploadForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="logo">Logo</SelectItem>
                    <SelectItem value="icon">Icon</SelectItem>
                    <SelectItem value="font">Font</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="asset-url">URL *</Label>
                <Input
                  id="asset-url"
                  value={uploadForm.url}
                  onChange={(e) => setUploadForm({ ...uploadForm, url: e.target.value })}
                  placeholder="https://example.com/asset.png"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="asset-tags">Tags (comma-separated)</Label>
                <Input
                  id="asset-tags"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                  placeholder="brand, logo, primary"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload}>Upload</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssets?.map((asset: any) => (
            <Card key={asset._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getAssetIcon(asset.type)}
                    <CardTitle className="text-base">{asset.name}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(asset._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {asset.type === "image" || asset.type === "logo" || asset.type === "icon" ? (
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-32 object-contain bg-muted rounded"
                  />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center bg-muted rounded">
                    {getAssetIcon(asset.type)}
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  {asset.tags.map((tag: any) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <a
                  href={asset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:underline truncate block"
                >
                  {asset.url}
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}