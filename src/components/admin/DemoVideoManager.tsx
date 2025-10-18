import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Video, Save, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const TIERS = [
  { id: "solopreneur", name: "Solopreneur", color: "bg-blue-500" },
  { id: "startup", name: "Startup", color: "bg-green-500" },
  { id: "sme", name: "SME", color: "bg-purple-500" },
  { id: "enterprise", name: "Enterprise", color: "bg-orange-500" },
];

export default function DemoVideoManager() {
  const demoVideos = useQuery(api.demoVideos.list);
  const upsertVideo = useMutation(api.demoVideos.upsert);
  const removeVideo = useMutation(api.demoVideos.remove);

  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    videoUrl: "",
    thumbnail: "",
    duration: "",
  });

  const handleEdit = (tier: string) => {
    const existing = demoVideos?.find((v: any) => v.tier === tier);
    if (existing) {
      setFormData({
        videoUrl: existing.videoUrl,
        thumbnail: existing.thumbnail || "",
        duration: existing.duration || "",
      });
    } else {
      setFormData({ videoUrl: "", thumbnail: "", duration: "" });
    }
    setEditingTier(tier);
  };

  const handleSave = async () => {
    if (!editingTier || !formData.videoUrl) {
      toast.error("Please provide a video URL");
      return;
    }

    try {
      await upsertVideo({
        tier: editingTier,
        videoUrl: formData.videoUrl,
        thumbnail: formData.thumbnail || undefined,
        duration: formData.duration || undefined,
      });
      toast.success("Demo video updated successfully");
      setEditingTier(null);
      setFormData({ videoUrl: "", thumbnail: "", duration: "" });
    } catch (error) {
      toast.error("Failed to update demo video");
      console.error(error);
    }
  };

  const handleDelete = async (tier: string) => {
    const video = demoVideos?.find((v: any) => v.tier === tier);
    if (!video) return;

    try {
      await removeVideo({ id: video._id });
      toast.success("Demo video removed");
    } catch (error) {
      toast.error("Failed to remove demo video");
      console.error(error);
    }
  };

  return (
    <Card className="neu-raised border-0">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="neu-inset rounded-xl p-3 bg-primary/10">
            <Video className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Demo Video Management</CardTitle>
            <CardDescription>
              Configure YouTube demo videos for each tier shown in the landing page carousel
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {TIERS.map((tier) => {
          const video = demoVideos?.find((v: any) => v.tier === tier.id);
          const isEditing = editingTier === tier.id;

          return (
            <Card key={tier.id} className="neu-flat border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${tier.color}`} />
                    <CardTitle className="text-lg">{tier.name}</CardTitle>
                    {video && (
                      <Badge variant="secondary" className="neu-inset">
                        Configured
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {video && !isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(video.videoUrl, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    {!isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(tier.id)}
                        className="neu-flat"
                      >
                        {video ? "Edit" : "Add Video"}
                      </Button>
                    )}
                    {video && !isEditing && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(tier.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              {isEditing && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`video-url-${tier.id}`}>
                      YouTube Video URL (Embed Format)
                    </Label>
                    <Input
                      id={`video-url-${tier.id}`}
                      placeholder="https://www.youtube.com/embed/VIDEO_ID"
                      value={formData.videoUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, videoUrl: e.target.value })
                      }
                      className="neu-inset"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use the embed URL format, not the regular watch URL
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`thumbnail-${tier.id}`}>
                      Thumbnail URL (Optional)
                    </Label>
                    <Input
                      id={`thumbnail-${tier.id}`}
                      placeholder="https://example.com/thumbnail.jpg"
                      value={formData.thumbnail}
                      onChange={(e) =>
                        setFormData({ ...formData, thumbnail: e.target.value })
                      }
                      className="neu-inset"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`duration-${tier.id}`}>
                      Duration (Optional)
                    </Label>
                    <Input
                      id={`duration-${tier.id}`}
                      placeholder="3:45"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: e.target.value })
                      }
                      className="neu-inset"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSave} className="neu-raised">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingTier(null);
                        setFormData({ videoUrl: "", thumbnail: "", duration: "" });
                      }}
                      className="neu-flat"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              )}
              {video && !isEditing && (
                <CardContent>
                  <div className="text-sm space-y-1">
                    <p className="text-muted-foreground">
                      <span className="font-medium">URL:</span>{" "}
                      {video.videoUrl.substring(0, 50)}...
                    </p>
                    {video.duration && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">Duration:</span> {video.duration}
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}