import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Palette, Type, Layout, Code } from "lucide-react";

interface ThemeEditorProps {
  businessId: Id<"businesses">;
  brandId?: Id<"brands">;
  onSave?: () => void;
}

export function ThemeEditor({ businessId, brandId, onSave }: ThemeEditorProps) {
  const createThemeVersion = useMutation(api.branding.createThemeVersion);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState({
    logoUrl: "",
    primaryColor: "#10b981",
    secondaryColor: "#059669",
    accentColor: "#34d399",
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
    customCss: "",
  });

  const handleSave = async () => {
    if (!name) {
      toast.error("Please enter a theme name");
      return;
    }

    try {
      await createThemeVersion({
        businessId,
        brandId,
        name,
        description,
        theme,
      });
      toast.success("Theme version created successfully");
      onSave?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to create theme version");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div>
          <Label htmlFor="theme-name">Theme Name *</Label>
          <Input
            id="theme-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Summer 2024"
          />
        </div>
        <div>
          <Label htmlFor="theme-description">Description</Label>
          <Textarea
            id="theme-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this theme version"
            rows={2}
          />
        </div>
      </div>

      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="colors">
            <Palette className="h-4 w-4 mr-2" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography">
            <Type className="h-4 w-4 mr-2" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="layout">
            <Layout className="h-4 w-4 mr-2" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="custom">
            <Code className="h-4 w-4 mr-2" />
            Custom CSS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
              <CardDescription>Define your brand colors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "primaryColor", label: "Primary Color" },
                { key: "secondaryColor", label: "Secondary Color" },
                { key: "accentColor", label: "Accent Color" },
                { key: "backgroundColor", label: "Background Color" },
                { key: "textColor", label: "Text Color" },
              ].map(({ key, label }) => (
                <div key={key} className="grid gap-2">
                  <Label>{label}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={theme[key as keyof typeof theme] as string}
                      onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={theme[key as keyof typeof theme] as string}
                      onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>Configure fonts and text styles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Font Family</Label>
                <Input
                  value={theme.fontFamily}
                  onChange={(e) => setTheme({ ...theme, fontFamily: e.target.value })}
                  placeholder="Inter, sans-serif"
                />
              </div>
              <div className="grid gap-2">
                <Label>Logo URL</Label>
                <Input
                  value={theme.logoUrl}
                  onChange={(e) => setTheme({ ...theme, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Layout Settings</CardTitle>
              <CardDescription>Configure spacing and borders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Border Radius</Label>
                <Input
                  value={theme.borderRadius}
                  onChange={(e) => setTheme({ ...theme, borderRadius: e.target.value })}
                  placeholder="0.5rem"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom CSS</CardTitle>
              <CardDescription>Add custom CSS rules</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={theme.customCss}
                onChange={(e) => setTheme({ ...theme, customCss: e.target.value })}
                placeholder=".custom-class { color: red; }"
                rows={10}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button onClick={handleSave}>Save Theme Version</Button>
      </div>
    </div>
  );
}
