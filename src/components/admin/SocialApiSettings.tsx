import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Twitter, Linkedin, Facebook, Save, Eye, EyeOff, Youtube, Globe } from "lucide-react";

type Platform = "twitter" | "linkedin" | "meta" | "youtube" | "google";
type SocialConfig = {
  platform: Platform;
  isActive: boolean;
  hasCredentials?: boolean;
  callbackUrl?: string;
};

const platformIcons = {
  twitter: Twitter,
  linkedin: Linkedin,
  meta: Facebook,
  youtube: Youtube,
  google: Globe,
};

const platformNames = {
  twitter: "Twitter/X",
  linkedin: "LinkedIn",
  meta: "Meta (Facebook & Instagram)",
  youtube: "YouTube",
  google: "Google",
};

const platformInstructions = {
  twitter: "Create an app at developer.twitter.com/en/portal/dashboard",
  linkedin: "Create an app at www.linkedin.com/developers/apps",
  meta: "Create an app at developers.facebook.com/apps - Covers both Facebook and Instagram",
  youtube: "Create a project at console.cloud.google.com and enable YouTube Data API v3",
  google: "Create OAuth credentials at console.cloud.google.com/apis/credentials",
};

export function SocialApiSettings() {
  const configs = useQuery(api.socialApiConfigs.listPlatformConfigs) as SocialConfig[] | undefined;
  const setPlatformConfig = useMutation(api.socialApiConfigs.setPlatformConfig);

  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);
  const [formData, setFormData] = useState({
    clientId: "",
    clientSecret: "",
    callbackUrl: "",
    isActive: true,
  });
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleEdit = (platform: Platform) => {
    const config = configs?.find((c: SocialConfig): c is SocialConfig => c.platform === platform);
    if (config) {
      setFormData({
        clientId: "",
        clientSecret: "",
        callbackUrl: config.callbackUrl || "",
        isActive: config.isActive,
      });
    } else {
      setFormData({
        clientId: "",
        clientSecret: "",
        callbackUrl: "",
        isActive: true,
      });
    }
    setEditingPlatform(platform);
    setShowSecret(false);
  };

  const handleSave = async () => {
    if (!editingPlatform) return;

    if (!formData.clientId || !formData.clientSecret) {
      toast.error("Client ID and Client Secret are required");
      return;
    }

    setSaving(true);
    try {
      await setPlatformConfig({
        platform: editingPlatform,
        clientId: formData.clientId,
        clientSecret: formData.clientSecret,
        callbackUrl: formData.callbackUrl || undefined,
        isActive: formData.isActive,
      });
      toast.success(`${platformNames[editingPlatform]} API configured successfully`);
      setEditingPlatform(null);
    } catch (error) {
      toast.error("Failed to save configuration");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const platforms: Platform[] = ["twitter", "linkedin", "meta", "youtube", "google"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Social Media API Configuration</h2>
        <p className="text-muted-foreground mt-1">
          Configure platform-level API credentials for all non-Enterprise users
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {platforms.map((platform) => {
          const config = configs?.find((c: SocialConfig): c is SocialConfig => c.platform === platform);
          const Icon = platformIcons[platform];
          const isEditing = editingPlatform === platform;

          return (
            <Card key={platform}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <CardTitle className="text-lg">{platformNames[platform]}</CardTitle>
                  </div>
                  {config?.hasCredentials && (
                    <Badge variant={config.isActive ? "default" : "secondary"}>
                      {config.isActive ? "Active" : "Inactive"}
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  {config?.hasCredentials
                    ? "API credentials configured"
                    : "No credentials configured"}
                </CardDescription>
                <CardDescription className="text-xs mt-1 text-muted-foreground">
                  {platformInstructions[platform]}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isEditing ? (
                  <Button onClick={() => handleEdit(platform)} className="w-full">
                    {config?.hasCredentials ? "Update" : "Configure"}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${platform}-clientId`}>Client ID</Label>
                      <Input
                        id={`${platform}-clientId`}
                        value={formData.clientId}
                        onChange={(e) =>
                          setFormData({ ...formData, clientId: e.target.value })
                        }
                        placeholder="Enter client ID"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${platform}-clientSecret`}>Client Secret</Label>
                      <div className="relative">
                        <Input
                          id={`${platform}-clientSecret`}
                          type={showSecret ? "text" : "password"}
                          value={formData.clientSecret}
                          onChange={(e) =>
                            setFormData({ ...formData, clientSecret: e.target.value })
                          }
                          placeholder="Enter client secret"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowSecret(!showSecret)}
                        >
                          {showSecret ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${platform}-callback`}>Callback URL (Optional)</Label>
                      <Input
                        id={`${platform}-callback`}
                        value={formData.callbackUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, callbackUrl: e.target.value })
                        }
                        placeholder="https://your-domain.com/callback"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor={`${platform}-active`}>Active</Label>
                      <Switch
                        id={`${platform}-active`}
                        checked={formData.isActive}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, isActive: checked })
                        }
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingPlatform(null)}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">How it works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            • <strong>Solopreneur, Startup, SME:</strong> Users authenticate through your
            platform-level OAuth apps
          </p>
          <p>
            • <strong>Enterprise:</strong> Can configure their own white-label API credentials
          </p>
          <p>
            • <strong>Meta:</strong> Single app covers both Facebook Pages and Instagram Business accounts
          </p>
          <p>
            • <strong>YouTube & Google:</strong> Require Google Cloud Console project setup
          </p>
          <p>
            • All user tokens are stored securely and scoped to their business
          </p>
        </CardContent>
      </Card>
    </div>
  );
}