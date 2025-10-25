import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface CapsuleWizardStep1Props {
  topic: string;
  setTopic: (topic: string) => void;
  tone: string;
  setTone: (tone: string) => void;
  platforms: Array<"twitter" | "linkedin" | "facebook">;
  togglePlatform: (platform: "twitter" | "linkedin" | "facebook") => void;
  generating: boolean;
  onGenerate: () => void;
}

export function CapsuleWizardStep1({
  topic,
  setTopic,
  tone,
  setTone,
  platforms,
  togglePlatform,
  generating,
  onGenerate,
}: CapsuleWizardStep1Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Content Configuration</CardTitle>
          <CardDescription>Tell us what you want to create</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="topic">Topic or Theme</Label>
            <Input
              id="topic"
              placeholder="e.g., productivity tips, business growth, industry insights"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="tone">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger id="tone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="authoritative">Authoritative</SelectItem>
                <SelectItem value="inspirational">Inspirational</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Target Platforms</Label>
            <div className="flex flex-wrap gap-3 mt-2">
              {[
                { id: "twitter", label: "Twitter/X", icon: "𝕏" },
                { id: "linkedin", label: "LinkedIn", icon: "in" },
                { id: "facebook", label: "Facebook", icon: "f" },
              ].map((platform) => (
                <div key={platform.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={platform.id}
                    checked={platforms.includes(platform.id as any)}
                    onCheckedChange={() => togglePlatform(platform.id as any)}
                  />
                  <label
                    htmlFor={platform.id}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {platform.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={onGenerate}
            disabled={generating || !topic || platforms.length === 0}
            className="w-full"
          >
            {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Content Capsule
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
