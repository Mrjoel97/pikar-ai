import * as React from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Twitter,
  Linkedin,
  Facebook,
  Sparkles,
  Image as ImageIcon,
  Save,
  Send,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

interface PostComposerProps {
  businessId: Id<"businesses">;
  userId: Id<"users">;
  onClose?: () => void;
  onPostCreated?: () => void;
  initialContent?: string;
  draftId?: Id<"socialPosts">;
}

// Platform-specific character limits
const PLATFORM_LIMITS = {
  twitter: 280,
  linkedin: 3000,
  facebook: 63206,
};

// Platform configurations
const PLATFORMS = [
  { id: "twitter", name: "Twitter", icon: Twitter, color: "text-blue-400" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-blue-600" },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "text-blue-500" },
] as const;

type PlatformId = "twitter" | "linkedin" | "facebook";

export function PostComposer({
  businessId,
  userId,
  onClose,
  onPostCreated,
  initialContent = "",
  draftId,
}: PostComposerProps) {
  const [content, setContent] = React.useState(initialContent);
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<PlatformId[]>(["twitter"]);
  const [mediaFiles, setMediaFiles] = React.useState<File[]>([]);
  const [mediaUrls, setMediaUrls] = React.useState<Id<"_storage">[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [previewPlatform, setPreviewPlatform] = React.useState<PlatformId>("twitter");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const createPost = useMutation(api.socialPosts.createSocialPost);
  const updatePost = useMutation(api.socialPosts.updateSocialPost);
  const generateUploadUrl = useAction(api.files.generateUploadUrl);

  // Calculate character count for each platform
  const getCharacterCount = (platform: PlatformId) => {
    const count = content.length;
    const limit = PLATFORM_LIMITS[platform];
    return { count, limit, remaining: limit - count, isOver: count > limit };
  };

  // Toggle platform selection
  const togglePlatform = (platform: PlatformId) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  // Handle media file selection
  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setMediaFiles((prev) => [...prev, ...files]);
  };

  // Upload media files
  const uploadMedia = async () => {
    const uploadedIds: Id<"_storage">[] = [];
    
    for (const file of mediaFiles) {
      try {
        const { url } = await generateUploadUrl({});
        const response = await fetch(url, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });
        
        if (response.ok) {
          const { storageId } = await response.json();
          uploadedIds.push(storageId);
        }
      } catch (error) {
        console.error("Media upload failed:", error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    
    return uploadedIds;
  };

  // AI content generation
  const handleAIGenerate = async () => {
    setIsGenerating(true);
    try {
      // TODO: Integrate with AI agent for content generation
      // For now, simulate AI generation
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const aiContent = `🚀 Exciting news! We're transforming the way businesses automate workflows with AI-powered solutions.\n\n✨ Key benefits:\n• Save time with intelligent automation\n• Boost productivity across teams\n• Scale effortlessly\n\n#AI #Automation #Productivity`;
      
      setContent(aiContent);
      toast.success("AI content generated!");
    } catch (error) {
      toast.error("Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  };

  // Save as draft
  const handleSaveDraft = async () => {
    if (!content.trim()) {
      toast.error("Please add some content first");
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    setIsSaving(true);
    try {
      const uploadedMedia = mediaFiles.length > 0 ? await uploadMedia() : mediaUrls;

      if (draftId) {
        await updatePost({
          postId: draftId,
          content,
          platforms: selectedPlatforms,
          mediaUrls: uploadedMedia.length > 0 ? uploadedMedia : undefined,
        });
        toast.success("Draft updated!");
      } else {
        await createPost({
          businessId,
          platforms: selectedPlatforms,
          content,
          mediaUrls: uploadedMedia.length > 0 ? uploadedMedia : undefined,
          status: "draft",
        });
        toast.success("Draft saved!");
      }

      setMediaFiles([]);
      setMediaUrls(uploadedMedia);
      onPostCreated?.();
    } catch (error) {
      toast.error("Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  // Publish post
  const handlePublish = async () => {
    if (!content.trim()) {
      toast.error("Please add some content first");
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    // Check character limits
    const overLimit = selectedPlatforms.some((platform) => {
      const { isOver } = getCharacterCount(platform);
      return isOver;
    });

    if (overLimit) {
      toast.error("Content exceeds character limit for selected platforms");
      return;
    }

    setIsSaving(true);
    try {
      const uploadedMedia = mediaFiles.length > 0 ? await uploadMedia() : mediaUrls;

      await createPost({
        businessId,
        platforms: selectedPlatforms,
        content,
        mediaUrls: uploadedMedia.length > 0 ? uploadedMedia : undefined,
        status: "posted",
      });

      toast.success("Post published successfully!");
      setContent("");
      setSelectedPlatforms(["twitter"]);
      setMediaFiles([]);
      setMediaUrls([]);
      onPostCreated?.();
      onClose?.();
    } catch (error) {
      toast.error("Failed to publish post");
    } finally {
      setIsSaving(false);
    }
  };

  // Remove media file
  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Create Social Post</span>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Platform Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Select Platforms</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              const isSelected = selectedPlatforms.includes(platform.id);
              const { count, limit, isOver } = getCharacterCount(platform.id);

              return (
                <Button
                  key={platform.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => togglePlatform(platform.id)}
                  className="flex items-center gap-2"
                >
                  <Icon className={`h-4 w-4 ${platform.color}`} />
                  {platform.name}
                  {isSelected && (
                    <Badge
                      variant={isOver ? "destructive" : "secondary"}
                      className="ml-1 text-xs"
                    >
                      {count}/{limit}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Content Editor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Content</label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAIGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {isGenerating ? "Generating..." : "AI Generate"}
            </Button>
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="min-h-[150px] resize-none"
            disabled={isGenerating || isSaving}
          />
          
          {/* Character count indicators */}
          {selectedPlatforms.length > 0 && content && (
            <div className="mt-2 space-y-1">
              {selectedPlatforms.map((platform) => {
                const { count, limit, remaining, isOver } = getCharacterCount(platform);
                const percentage = (count / limit) * 100;
                const platformInfo = PLATFORMS.find((p) => p.id === platform);

                return (
                  <div key={platform} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1">
                        {platformInfo && <platformInfo.icon className="h-3 w-3" />}
                        {platformInfo?.name}
                      </span>
                      <span className={isOver ? "text-destructive font-medium" : "text-muted-foreground"}>
                        {remaining} characters remaining
                      </span>
                    </div>
                    <Progress
                      value={Math.min(percentage, 100)}
                      className={`h-1 ${isOver ? "bg-destructive/20" : ""}`}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Media Upload */}
        <div>
          <label className="text-sm font-medium mb-2 block">Media</label>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSaving}
              className="w-full"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Add Images/Videos
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleMediaSelect}
            />
            
            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {mediaFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded border bg-muted flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeMedia(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <p className="text-xs truncate mt-1">{file.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="text-sm font-medium mb-2 block">Preview</label>
          <Tabs value={previewPlatform} onValueChange={(v) => setPreviewPlatform(v as PlatformId)}>
            <TabsList className="grid w-full grid-cols-3">
              {PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                return (
                  <TabsTrigger
                    key={platform.id}
                    value={platform.id}
                    disabled={!selectedPlatforms.includes(platform.id)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {platform.name}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            {PLATFORMS.map((platform) => (
              <TabsContent key={platform.id} value={platform.id} className="mt-4">
                <Card className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <platform.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm mb-1">Your Business</div>
                        <div className="text-sm whitespace-pre-wrap break-words">
                          {content || "Your post content will appear here..."}
                        </div>
                        {mediaFiles.length > 0 && (
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {mediaFiles.slice(0, 4).map((_, index) => (
                              <div
                                key={index}
                                className="aspect-video rounded bg-muted flex items-center justify-center"
                              >
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Validation Alerts */}
        {selectedPlatforms.some((p) => getCharacterCount(p).isOver) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Content exceeds character limit for some platforms. Please shorten your post.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSaving || isGenerating || !content.trim()}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button
            onClick={handlePublish}
            disabled={
              isSaving ||
              isGenerating ||
              !content.trim() ||
              selectedPlatforms.length === 0 ||
              selectedPlatforms.some((p) => getCharacterCount(p).isOver)
            }
            className="flex-1"
          >
            <Send className="h-4 w-4 mr-2" />
            Publish Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
