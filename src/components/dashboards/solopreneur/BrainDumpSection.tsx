import React, { useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Mic, Play, Pause, Trash2, RefreshCw } from "lucide-react";

interface BrainDumpSectionProps {
  businessId: string;
}

export function BrainDumpSection({ businessId }: BrainDumpSectionProps) {
  const initiatives = useQuery(
    api.initiatives.getByBusiness as any,
    businessId ? { businessId } : "skip",
  );
  const initiativeId =
    initiatives && initiatives.length > 0 && initiatives[0] ? initiatives[0]._id : null;

  const dumps = useQuery(
    api.initiatives.listBrainDumpsByInitiative as any,
    initiativeId ? { initiativeId, limit: 10 } : "skip",
  );

  const addDump = useMutation(api.initiatives.addBrainDump as any);
  const addVoiceDump = useMutation(api.initiatives.addVoiceBrainDump as any);
  const deleteDump = useMutation(api.initiatives.deleteBrainDump as any);
  const softDelete = useMutation(api.initiatives.softDeleteBrainDump as any);
  const restoreDump = useMutation(api.initiatives.restoreBrainDump as any);

  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTagFilter, setActiveTagFilter] = useState<"" | "content" | "offer" | "ops">("");
  const [lastDeletedItem, setLastDeletedItem] = useState<any | null>(null);

  // Audio recording state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const getUploadUrl = useAction(api.files.getUploadUrl as any);

  const searchArgs = useMemo(
    () =>
      initiativeId
        ? {
            initiativeId,
            q: searchQuery,
            limit: 5,
          }
        : "skip",
    [initiativeId, searchQuery],
  );
  const searchResults = useQuery(api.initiatives.searchBrainDumps, searchArgs);

  const tagIdea = (content: string): string[] => {
    const lower = content.toLowerCase();
    const tags: string[] = [];
    if (lower.includes("content") || lower.includes("post") || lower.includes("blog")) {
      tags.push("content");
    }
    if (lower.includes("offer") || lower.includes("product") || lower.includes("sale")) {
      tags.push("offer");
    }
    if (lower.includes("ops") || lower.includes("process") || lower.includes("workflow")) {
      tags.push("ops");
    }
    return tags;
  };

  const handleSaveIdea = async () => {
    if (!initiativeId) {
      toast("No initiative found. Run Phase 0 setup first.");
      return;
    }
    const content = text.trim();
    if (!content) {
      toast("Type an idea first.");
      return;
    }
    try {
      setSaving(true);
      const tags = tagIdea(content);
      await addDump({ initiativeId, content, tags });
      setText("");
      toast.success("Saved idea.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save idea.");
    } finally {
      setSaving(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
      toast("Recording started");
    } catch (e: any) {
      toast.error(e?.message ?? "Mic permission denied");
    }
  };

  const stopRecording = () => {
    try {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      toast("Recording stopped");
    } catch {}
  };

  const handleDelete = async (dumpId: string) => {
    try {
      await softDelete({ dumpId });
      setLastDeletedItem({ dumpId });
      toast.success("Deleted. Undo available.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete");
    }
  };

  const handleRestore = async () => {
    if (!lastDeletedItem?.dumpId) return;
    try {
      await restoreDump({ dumpId: lastDeletedItem.dumpId });
      setLastDeletedItem(null);
      toast.success("Restored");
    } catch (e: any) {
      toast.error(e?.message || "Failed to restore");
    }
  };

  const filteredDumps = useMemo(() => {
    if (!dumps) return [];
    if (!activeTagFilter) return dumps;
    return dumps.filter((d: any) => d.tags?.includes(activeTagFilter));
  }, [dumps, activeTagFilter]);

  return (
    <Card className="p-4 mt-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Brain Dump</h3>
          <span className="text-xs text-muted-foreground">
            Capture rough ideas quickly
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search ideas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-56"
          />
        </div>
      </div>

      <Separator className="my-3" />

      {/* Voice recording controls */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Button
          size="sm"
          variant={isRecording ? "default" : "outline"}
          onClick={isRecording ? stopRecording : startRecording}
          className={isRecording ? "bg-red-600 text-white hover:bg-red-700" : ""}
        >
          <Mic className="h-4 w-4 mr-1" />
          {isRecording ? "Stop Recording" : "Record Voice"}
        </Button>
      </div>

      {/* Text input */}
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Type a quick idea..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSaveIdea();
            }
          }}
        />
        <Button onClick={handleSaveIdea} disabled={saving || !text.trim()}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Tag filters */}
      <div className="flex gap-2 mb-3">
        <Button
          size="sm"
          variant={activeTagFilter === "" ? "default" : "outline"}
          onClick={() => setActiveTagFilter("")}
        >
          All
        </Button>
        <Button
          size="sm"
          variant={activeTagFilter === "content" ? "default" : "outline"}
          onClick={() => setActiveTagFilter("content")}
        >
          Content
        </Button>
        <Button
          size="sm"
          variant={activeTagFilter === "offer" ? "default" : "outline"}
          onClick={() => setActiveTagFilter("offer")}
        >
          Offer
        </Button>
        <Button
          size="sm"
          variant={activeTagFilter === "ops" ? "default" : "outline"}
          onClick={() => setActiveTagFilter("ops")}
        >
          Ops
        </Button>
      </div>

      {/* Undo restore */}
      {lastDeletedItem && (
        <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded flex items-center justify-between">
          <span className="text-sm">Item deleted</span>
          <Button size="sm" variant="outline" onClick={handleRestore}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Undo
          </Button>
        </div>
      )}

      {/* Dumps list */}
      <div className="space-y-2">
        {filteredDumps.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">
            No ideas yet. Start capturing!
          </div>
        )}
        {filteredDumps.map((dump: any) => (
          <div
            key={dump._id}
            className="p-3 border rounded flex items-start justify-between gap-2"
          >
            <div className="flex-1">
              <div className="text-sm">{dump.content}</div>
              {dump.tags && dump.tags.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {dump.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleDelete(dump._id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
