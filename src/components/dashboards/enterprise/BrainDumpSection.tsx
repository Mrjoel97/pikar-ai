import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mic, MicOff } from "lucide-react";

interface BrainDumpSectionProps {
  businessId: string;
}

export function BrainDumpSection({ businessId }: BrainDumpSectionProps) {
  const [dumpText, setDumpText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const saveBrainDump = useMutation(api.solopreneur.saveBrainDump);

  const handleSave = async () => {
    if (!dumpText.trim()) {
      toast.error("Enter some text first");
      return;
    }
    try {
      await saveBrainDump({ businessId: businessId as any, content: dumpText });
      toast.success("Brain dump saved");
      setDumpText("");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    }
  };

  const handleVoiceNote = () => {
    if (isRecording) {
      setIsRecording(false);
      toast.info("Voice recording stopped (stub)");
    } else {
      setIsRecording(true);
      toast.info("Voice recording started (stub)");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Brain Dump</span>
          <Button
            size="sm"
            variant={isRecording ? "destructive" : "outline"}
            onClick={handleVoiceNote}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Quick thoughts, ideas, tasks..."
          value={dumpText}
          onChange={(e) => setDumpText(e.target.value)}
          rows={4}
        />
        <Button onClick={handleSave} disabled={!dumpText.trim()}>
          Save
        </Button>
      </CardContent>
    </Card>
  );
}