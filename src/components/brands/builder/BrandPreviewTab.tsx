import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

interface BrandPreviewTabProps {
  brandProfile: any;
  insights: any;
}

export function BrandPreviewTab({ brandProfile, insights }: BrandPreviewTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand Preview</CardTitle>
        <CardDescription>See how your brand elements come together</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Brand Header Preview */}
        <div
          className="p-8 rounded-lg"
          style={{
            backgroundColor: brandProfile.visualIdentity.primaryColor,
            color: "white",
          }}
        >
          <h1
            className="text-4xl font-bold mb-2"
            style={{ fontFamily: brandProfile.visualIdentity.fonts.heading }}
          >
            {brandProfile.brandName || "Your Brand Name"}
          </h1>
          <p
            className="text-lg opacity-90"
            style={{ fontFamily: brandProfile.visualIdentity.fonts.body }}
          >
            {brandProfile.tagline || "Your brand tagline goes here"}
          </p>
        </div>

        {/* Color Palette Preview */}
        <div>
          <Label className="mb-2 block">Color Palette</Label>
          <div className="flex gap-2 h-20">
            <div
              className="flex-1 rounded flex items-end justify-center p-2 text-white text-sm font-medium"
              style={{ backgroundColor: brandProfile.visualIdentity.primaryColor }}
            >
              Primary
            </div>
            <div
              className="flex-1 rounded flex items-end justify-center p-2 text-white text-sm font-medium"
              style={{ backgroundColor: brandProfile.visualIdentity.secondaryColor }}
            >
              Secondary
            </div>
            <div
              className="flex-1 rounded flex items-end justify-center p-2 text-white text-sm font-medium"
              style={{ backgroundColor: brandProfile.visualIdentity.accentColor }}
            >
              Accent
            </div>
          </div>
        </div>

        {/* Typography Preview */}
        <div>
          <Label className="mb-2 block">Typography</Label>
          <div className="space-y-2 p-4 border rounded">
            <h2
              className="text-2xl font-bold"
              style={{ fontFamily: brandProfile.visualIdentity.fonts.heading }}
            >
              Heading Font: {brandProfile.visualIdentity.fonts.heading}
            </h2>
            <p
              className="text-base"
              style={{ fontFamily: brandProfile.visualIdentity.fonts.body }}
            >
              Body Font: {brandProfile.visualIdentity.fonts.body} - This is how your body
              text will appear in your brand materials.
            </p>
          </div>
        </div>

        {/* Brand Values */}
        {brandProfile.values.length > 0 && (
          <div>
            <Label className="mb-2 block">Brand Values</Label>
            <div className="flex flex-wrap gap-2">
              {brandProfile.values.map((value: string, index: number) => (
                <Badge
                  key={index}
                  style={{
                    backgroundColor: brandProfile.visualIdentity.secondaryColor,
                    color: "white",
                  }}
                >
                  {value}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Voice Tone Chart */}
        <div>
          <Label className="mb-2 block">Voice & Tone Profile</Label>
          <div className="space-y-2 p-4 border rounded">
            <div className="flex items-center justify-between text-sm">
              <span>Formal</span>
              <Progress value={brandProfile.voiceTone.formal} className="w-1/2" />
              <span>{brandProfile.voiceTone.formal}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Friendly</span>
              <Progress value={brandProfile.voiceTone.friendly} className="w-1/2" />
              <span>{brandProfile.voiceTone.friendly}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Professional</span>
              <Progress value={brandProfile.voiceTone.professional} className="w-1/2" />
              <span>{brandProfile.voiceTone.professional}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Playful</span>
              <Progress value={brandProfile.voiceTone.playful} className="w-1/2" />
              <span>{brandProfile.voiceTone.playful}%</span>
            </div>
          </div>
        </div>

        {insights && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">Brand Performance Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Brand Awareness</div>
                  <div className="flex items-center gap-2">
                    <Progress value={insights.performance.brandAwareness} className="flex-1" />
                    <span className="text-sm font-medium">
                      {insights.performance.brandAwareness}%
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Brand Loyalty</div>
                  <div className="flex items-center gap-2">
                    <Progress value={insights.performance.brandLoyalty} className="flex-1" />
                    <span className="text-sm font-medium">
                      {insights.performance.brandLoyalty}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                {insights.trends.map((trend: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm p-2 bg-background rounded">
                    <span>{trend.metric}</span>
                    <Badge variant={trend.trend === "up" ? "default" : "secondary"}>
                      {trend.change}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
