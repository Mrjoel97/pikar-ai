import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Lightbulb } from "lucide-react";

interface VoiceToneTabProps {
  brandProfile: any;
  setBrandProfile: (profile: any) => void;
  suggestions: any;
  onGetSuggestions: () => void;
}

export function VoiceToneTab({
  brandProfile,
  setBrandProfile,
  suggestions,
  onGetSuggestions,
}: VoiceToneTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Voice & Tone</CardTitle>
        <CardDescription>Define how your brand communicates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Formal ↔ Casual</Label>
              <span className="text-sm text-muted-foreground">
                {brandProfile.voiceTone.formal}%
              </span>
            </div>
            <Slider
              value={[brandProfile.voiceTone.formal]}
              onValueChange={([value]) =>
                setBrandProfile({
                  ...brandProfile,
                  voiceTone: { ...brandProfile.voiceTone, formal: value },
                })
              }
              max={100}
              step={1}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Reserved ↔ Friendly</Label>
              <span className="text-sm text-muted-foreground">
                {brandProfile.voiceTone.friendly}%
              </span>
            </div>
            <Slider
              value={[brandProfile.voiceTone.friendly]}
              onValueChange={([value]) =>
                setBrandProfile({
                  ...brandProfile,
                  voiceTone: { ...brandProfile.voiceTone, friendly: value },
                })
              }
              max={100}
              step={1}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Relaxed ↔ Professional</Label>
              <span className="text-sm text-muted-foreground">
                {brandProfile.voiceTone.professional}%
              </span>
            </div>
            <Slider
              value={[brandProfile.voiceTone.professional]}
              onValueChange={([value]) =>
                setBrandProfile({
                  ...brandProfile,
                  voiceTone: { ...brandProfile.voiceTone, professional: value },
                })
              }
              max={100}
              step={1}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Serious ↔ Playful</Label>
              <span className="text-sm text-muted-foreground">
                {brandProfile.voiceTone.playful}%
              </span>
            </div>
            <Slider
              value={[brandProfile.voiceTone.playful]}
              onValueChange={([value]) =>
                setBrandProfile({
                  ...brandProfile,
                  voiceTone: { ...brandProfile.voiceTone, playful: value },
                })
              }
              max={100}
              step={1}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="writingStyle">Writing Style Description</Label>
          <Textarea
            id="writingStyle"
            value={brandProfile.contentGuidelines.writingStyle}
            onChange={(e) =>
              setBrandProfile({
                ...brandProfile,
                contentGuidelines: {
                  ...brandProfile.contentGuidelines,
                  writingStyle: e.target.value,
                },
              })
            }
            placeholder="Describe your brand's writing style..."
            rows={4}
          />
        </div>

        <Button onClick={onGetSuggestions} variant="outline" className="w-full">
          <Lightbulb className="mr-2 h-4 w-4" />
          Get AI Suggestions
        </Button>

        {suggestions && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">AI Suggestions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestions.categories
                .find((c: any) => c.category === "Brand Voice")
                ?.suggestions.map((sug: any, i: number) => (
                  <div key={i} className="space-y-1">
                    <div className="font-medium text-sm">{sug.title}</div>
                    <div className="text-sm text-muted-foreground">{sug.description}</div>
                    <Badge variant="outline" className="text-xs">
                      Impact: {sug.impact}
                    </Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
