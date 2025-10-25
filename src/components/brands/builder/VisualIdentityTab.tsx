import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Palette, Type, RefreshCw, Sparkles } from "lucide-react";

interface VisualIdentityTabProps {
  brandProfile: any;
  setBrandProfile: (profile: any) => void;
  isGenerating: boolean;
  generatedAssets: any;
  onGenerate: () => void;
  onApplyColorPalette: (palette: any) => void;
  onApplyFontPairing: (fonts: any) => void;
}

export function VisualIdentityTab({
  brandProfile,
  setBrandProfile,
  isGenerating,
  generatedAssets,
  onGenerate,
  onApplyColorPalette,
  onApplyFontPairing,
}: VisualIdentityTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Visual Identity</CardTitle>
            <CardDescription>Define your brand's visual elements</CardDescription>
          </div>
          <Button onClick={onGenerate} disabled={isGenerating} variant="outline">
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Assets
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color Palette */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <Label className="text-base font-semibold">Color Palette</Label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={brandProfile.visualIdentity.primaryColor}
                  onChange={(e) =>
                    setBrandProfile({
                      ...brandProfile,
                      visualIdentity: {
                        ...brandProfile.visualIdentity,
                        primaryColor: e.target.value,
                      },
                    })
                  }
                  className="w-20 h-10"
                />
                <Input
                  value={brandProfile.visualIdentity.primaryColor}
                  onChange={(e) =>
                    setBrandProfile({
                      ...brandProfile,
                      visualIdentity: {
                        ...brandProfile.visualIdentity,
                        primaryColor: e.target.value,
                      },
                    })
                  }
                  placeholder="#000000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={brandProfile.visualIdentity.secondaryColor}
                  onChange={(e) =>
                    setBrandProfile({
                      ...brandProfile,
                      visualIdentity: {
                        ...brandProfile.visualIdentity,
                        secondaryColor: e.target.value,
                      },
                    })
                  }
                  className="w-20 h-10"
                />
                <Input
                  value={brandProfile.visualIdentity.secondaryColor}
                  onChange={(e) =>
                    setBrandProfile({
                      ...brandProfile,
                      visualIdentity: {
                        ...brandProfile.visualIdentity,
                        secondaryColor: e.target.value,
                      },
                    })
                  }
                  placeholder="#666666"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  id="accentColor"
                  type="color"
                  value={brandProfile.visualIdentity.accentColor}
                  onChange={(e) =>
                    setBrandProfile({
                      ...brandProfile,
                      visualIdentity: {
                        ...brandProfile.visualIdentity,
                        accentColor: e.target.value,
                      },
                    })
                  }
                  className="w-20 h-10"
                />
                <Input
                  value={brandProfile.visualIdentity.accentColor}
                  onChange={(e) =>
                    setBrandProfile({
                      ...brandProfile,
                      visualIdentity: {
                        ...brandProfile.visualIdentity,
                        accentColor: e.target.value,
                      },
                    })
                  }
                  placeholder="#999999"
                />
              </div>
            </div>
          </div>

          {generatedAssets?.colorPalettes && (
            <div className="space-y-2">
              <Label>AI-Generated Palettes</Label>
              <div className="grid gap-3 md:grid-cols-3">
                {generatedAssets.colorPalettes.map((palette: any, index: number) => (
                  <Card
                    key={index}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => onApplyColorPalette(palette)}
                  >
                    <CardContent className="p-4">
                      <div className="text-sm font-medium mb-2">{palette.name}</div>
                      <div className="flex gap-1 h-8">
                        <div
                          className="flex-1 rounded"
                          style={{ backgroundColor: palette.primary }}
                        />
                        <div
                          className="flex-1 rounded"
                          style={{ backgroundColor: palette.secondary }}
                        />
                        <div
                          className="flex-1 rounded"
                          style={{ backgroundColor: palette.accent }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Typography */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            <Label className="text-base font-semibold">Typography</Label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="headingFont">Heading Font</Label>
              <Select
                value={brandProfile.visualIdentity.fonts.heading}
                onValueChange={(value) =>
                  setBrandProfile({
                    ...brandProfile,
                    visualIdentity: {
                      ...brandProfile.visualIdentity,
                      fonts: {
                        ...brandProfile.visualIdentity.fonts,
                        heading: value,
                      },
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Poppins">Poppins</SelectItem>
                  <SelectItem value="Montserrat">Montserrat</SelectItem>
                  <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bodyFont">Body Font</Label>
              <Select
                value={brandProfile.visualIdentity.fonts.body}
                onValueChange={(value) =>
                  setBrandProfile({
                    ...brandProfile,
                    visualIdentity: {
                      ...brandProfile.visualIdentity,
                      fonts: {
                        ...brandProfile.visualIdentity.fonts,
                        body: value,
                      },
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Open Sans">Open Sans</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                  <SelectItem value="Source Sans Pro">Source Sans Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {generatedAssets?.fontPairings && (
            <div className="space-y-2">
              <Label>AI-Generated Font Pairings</Label>
              <div className="grid gap-3 md:grid-cols-3">
                {generatedAssets.fontPairings.map((fonts: any, index: number) => (
                  <Card
                    key={index}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => onApplyFontPairing(fonts)}
                  >
                    <CardContent className="p-4">
                      <div className="text-sm font-medium mb-1">{fonts.style}</div>
                      <div className="text-xs text-muted-foreground">
                        {fonts.heading} / {fonts.body}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Logo */}
        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input
            id="logoUrl"
            value={brandProfile.visualIdentity.logoUrl}
            onChange={(e) =>
              setBrandProfile({
                ...brandProfile,
                visualIdentity: {
                  ...brandProfile.visualIdentity,
                  logoUrl: e.target.value,
                },
              })
            }
            placeholder="https://example.com/logo.png"
          />
        </div>
      </CardContent>
    </Card>
  );
}
