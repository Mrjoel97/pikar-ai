import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AbTestingControlsProps {
  enableAb: boolean;
  setEnableAb: (value: boolean) => void;
  variantB: {
    subject: string;
    body: string;
  };
  setVariantB: (variant: { subject: string; body: string }) => void;
}

export function AbTestingControls({
  enableAb,
  setEnableAb,
  variantB,
  setVariantB,
}: AbTestingControlsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">A/B Testing</CardTitle>
            <CardDescription>Test two variants to optimize performance</CardDescription>
          </div>
          <Switch checked={enableAb} onCheckedChange={setEnableAb} />
        </div>
      </CardHeader>
      {enableAb && (
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="variantBSubject">Variant B Subject</Label>
            <Input
              id="variantBSubject"
              value={variantB.subject}
              onChange={(e) => setVariantB({ ...variantB, subject: e.target.value })}
              placeholder="Alternative subject line"
            />
          </div>
          <div>
            <Label htmlFor="variantBBody">Variant B Body</Label>
            <Textarea
              id="variantBBody"
              value={variantB.body}
              onChange={(e) => setVariantB({ ...variantB, body: e.target.value })}
              placeholder="Alternative email body"
              rows={6}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
