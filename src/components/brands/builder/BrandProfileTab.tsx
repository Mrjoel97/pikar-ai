import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

interface BrandProfileTabProps {
  brandProfile: any;
  setBrandProfile: (profile: any) => void;
  newValue: string;
  setNewValue: (value: string) => void;
  newPersonality: string;
  setNewPersonality: (value: string) => void;
  isAnalyzing: boolean;
  analysis: any;
  onAnalyze: () => void;
}

export function BrandProfileTab({
  brandProfile,
  setBrandProfile,
  newValue,
  setNewValue,
  newPersonality,
  setNewPersonality,
  isAnalyzing,
  analysis,
  onAnalyze,
}: BrandProfileTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand Profile</CardTitle>
        <CardDescription>Define your brand's core identity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="brandName">Brand Name *</Label>
            <Input
              id="brandName"
              value={brandProfile.brandName}
              onChange={(e) =>
                setBrandProfile({ ...brandProfile, brandName: e.target.value })
              }
              placeholder="Enter your brand name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry *</Label>
            <Select
              value={brandProfile.industry}
              onValueChange={(value) =>
                setBrandProfile({ ...brandProfile, industry: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="consulting">Consulting</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            value={brandProfile.tagline}
            onChange={(e) =>
              setBrandProfile({ ...brandProfile, tagline: e.target.value })
            }
            placeholder="Your brand's memorable tagline"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mission">Mission Statement</Label>
          <Textarea
            id="mission"
            value={brandProfile.mission}
            onChange={(e) =>
              setBrandProfile({ ...brandProfile, mission: e.target.value })
            }
            placeholder="What is your brand's purpose?"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vision">Vision Statement</Label>
          <Textarea
            id="vision"
            value={brandProfile.vision}
            onChange={(e) =>
              setBrandProfile({ ...brandProfile, vision: e.target.value })
            }
            placeholder="Where do you see your brand in the future?"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetAudience">Target Audience</Label>
          <Textarea
            id="targetAudience"
            value={brandProfile.targetAudience}
            onChange={(e) =>
              setBrandProfile({ ...brandProfile, targetAudience: e.target.value })
            }
            placeholder="Describe your ideal customer or audience"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Brand Values</Label>
          <div className="flex gap-2">
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Add a brand value"
              onKeyPress={(e) => {
                if (e.key === "Enter" && newValue.trim()) {
                  setBrandProfile({
                    ...brandProfile,
                    values: [...brandProfile.values, newValue.trim()],
                  });
                  setNewValue("");
                }
              }}
            />
            <Button
              onClick={() => {
                if (newValue.trim()) {
                  setBrandProfile({
                    ...brandProfile,
                    values: [...brandProfile.values, newValue.trim()],
                  });
                  setNewValue("");
                }
              }}
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {brandProfile.values.map((value: string, index: number) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => {
                  setBrandProfile({
                    ...brandProfile,
                    values: brandProfile.values.filter((_: any, i: number) => i !== index),
                  });
                }}
              >
                {value} ×
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Brand Personality Traits</Label>
          <div className="flex gap-2">
            <Input
              value={newPersonality}
              onChange={(e) => setNewPersonality(e.target.value)}
              placeholder="Add a personality trait"
              onKeyPress={(e) => {
                if (e.key === "Enter" && newPersonality.trim()) {
                  setBrandProfile({
                    ...brandProfile,
                    personality: [...brandProfile.personality, newPersonality.trim()],
                  });
                  setNewPersonality("");
                }
              }}
            />
            <Button
              onClick={() => {
                if (newPersonality.trim()) {
                  setBrandProfile({
                    ...brandProfile,
                    personality: [...brandProfile.personality, newPersonality.trim()],
                  });
                  setNewPersonality("");
                }
              }}
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {brandProfile.personality.map((trait: string, index: number) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer"
                onClick={() => {
                  setBrandProfile({
                    ...brandProfile,
                    personality: brandProfile.personality.filter((_: any, i: number) => i !== index),
                  });
                }}
              >
                {trait} ×
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        <Button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze Brand with AI
            </>
          )}
        </Button>

        {analysis && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">Brand Analysis Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Brand Strength</div>
                  <div className="flex items-center gap-2">
                    <Progress value={analysis.brandStrength} className="flex-1" />
                    <span className="text-sm font-medium">{analysis.brandStrength}%</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Consistency</div>
                  <div className="flex items-center gap-2">
                    <Progress value={analysis.consistency} className="flex-1" />
                    <span className="text-sm font-medium">{analysis.consistency}%</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Competitive Advantages</div>
                <div className="space-y-1">
                  {analysis.competitiveAdvantages.map((adv: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      {adv}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Areas for Improvement</div>
                <div className="space-y-1">
                  {analysis.areasForImprovement.map((area: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      {area}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
