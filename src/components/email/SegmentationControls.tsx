import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SegmentationControlsProps {
  useSegmentation: boolean;
  setUseSegmentation: (value: boolean) => void;
  segmentType: "status" | "tag" | "engagement";
  setSegmentType: (type: "status" | "tag" | "engagement") => void;
  segmentValue: string;
  setSegmentValue: (value: string) => void;
  segments: any;
  segmentEmails: string[] | undefined;
}

export function SegmentationControls({
  useSegmentation,
  setUseSegmentation,
  segmentType,
  setSegmentType,
  segmentValue,
  setSegmentValue,
  segments,
  segmentEmails,
}: SegmentationControlsProps) {
  return (
    <div className="space-y-3">
      <Label>Segmentation (optional)</Label>
      <div className="flex items-center gap-3">
        <Switch checked={useSegmentation} onCheckedChange={setUseSegmentation} />
        <span className="text-sm text-muted-foreground">Target a saved segment instead of manual recipients or list</span>
      </div>

      {useSegmentation && (
        <div className="space-y-3 rounded-lg border p-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Segment Type</Label>
              <select
                value={segmentType}
                onChange={(e) => setSegmentType(e.target.value as any)}
                className="w-full border rounded p-2 text-sm"
              >
                <option value="status">Status</option>
                <option value="tag">Tag</option>
                <option value="engagement">Engagement</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <Label className="text-xs">Segment</Label>
              <select
                value={segmentValue}
                onChange={(e) => setSegmentValue(e.target.value)}
                className="w-full border rounded p-2 text-sm"
              >
                <option value="">Select...</option>
                {segmentType === "status" &&
                  Object.keys(segments?.byStatus || {}).map((k) => (
                    <option key={k} value={k}>
                      {k} ({(segments?.byStatus as any)?.[k]})
                    </option>
                  ))}
                {segmentType === "tag" &&
                  Object.keys(segments?.byTag || {}).map((k) => (
                    <option key={k} value={k}>
                      {k} ({(segments?.byTag as any)?.[k]})
                    </option>
                  ))}
                {segmentType === "engagement" &&
                  Object.keys(segments?.engagementSegments || {}).map((k) => (
                    <option key={k} value={k}>
                      {k} ({(segments?.engagementSegments as any)?.[k]})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {Array.isArray(segmentEmails) && (
            <div className="text-xs text-muted-foreground">
              📊 {segmentEmails.length} contacts in this segment
            </div>
          )}
        </div>
      )}
    </div>
  );
}
