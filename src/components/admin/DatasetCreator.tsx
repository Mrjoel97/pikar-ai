import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type Props = {
  onCreate: (payload: { title: string; sourceType: "url" | "note"; sourceUrl?: string; noteText?: string }) => Promise<void> | void;
};

export default function DatasetCreator({ onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState<"url" | "note">("url");
  const [sourceUrl, setSourceUrl] = useState("");
  const [noteText, setNoteText] = useState("");

  const canCreate =
    title.trim().length > 0 &&
    ((sourceType === "url" && sourceUrl.trim().length > 0) || (sourceType === "note" && noteText.trim().length > 0));

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Onboarding Guide" />
        </div>
        <div>
          <label className="text-sm font-medium">Type</label>
          <Select value={sourceType} onValueChange={(v: "url" | "note") => setSourceType(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="url">URL</SelectItem>
              <SelectItem value="note">Note</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {sourceType === "url" ? (
        <div>
          <label className="text-sm font-medium">Source URL</label>
          <Input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." />
        </div>
      ) : (
        <div>
          <label className="text-sm font-medium">Note</label>
          <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={3} />
        </div>
      )}
      <div className="flex justify-end">
        <Button
          disabled={!canCreate}
          onClick={async () => {
            await onCreate({
              title: title.trim(),
              sourceType,
              sourceUrl: sourceType === "url" ? sourceUrl.trim() : undefined,
              noteText: sourceType === "note" ? noteText.trim() : undefined,
            });
            setTitle("");
            setSourceUrl("");
            setNoteText("");
          }}
        >
          Create Dataset
        </Button>
      </div>
    </div>
  );
}
