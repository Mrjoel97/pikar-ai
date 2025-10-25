import React from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mic, MicOff, Loader2, Trash2, Search, Undo2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceNotesProps {
  businessId: Id<"businesses">;
  initiativeId: Id<"initiatives"> | undefined;
}

export function VoiceNotes({ businessId, initiativeId }: VoiceNotesProps) {
  const addVoiceNoteMutation = useMutation(api.voiceNotes.addVoiceNote);
  const deleteVoiceNote = useMutation(api.voiceNotes.deleteVoiceNote);
  const transcribeAudio = useAction(api.voiceNotes.transcribeVoiceNote);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const addDump = useMutation(api.initiatives.addBrainDump);
  const deleteDump = useMutation(api.initiatives.deleteBrainDump);
  const restoreDump = useMutation(api.initiatives.restoreBrainDump);

  const [text, setText] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [lastDeletedItem, setLastDeletedItem] = React.useState<any>(null);
  const [restoring, setRestoring] = React.useState(false);

  // Voice recording state
  const [recording, setRecording] = React.useState(false);
  const [micPermission, setMicPermission] = React.useState<"prompt" | "granted" | "denied">("prompt");
  const [micError, setMicError] = React.useState<string | null>(null);
  const [recordingMs, setRecordingMs] = React.useState(0);
  const [recordingTimer, setRecordingTimer] = React.useState<number | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = React.useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = React.useState(0);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);

  const searchArgsMemo = React.useMemo(() => {
    if (!initiativeId || !searchQuery.trim()) return undefined;
    return { initiativeId, query: searchQuery.trim() };
  }, [initiativeId, searchQuery]);

  const searchResults = useQuery(api.initiatives.searchBrainDumps, searchArgsMemo);
  const allDumps = useQuery(
    api.initiatives.getBrainDumps,
    initiativeId ? { initiativeId } : "skip"
  );

  const displayedDumps = searchQuery.trim() ? searchResults : allDumps;

  const handleSaveIdea = async () => {
    if (!initiativeId) {
      toast.error("No initiative found. Complete onboarding first.");
      return;
    }
    const content = text.trim();
    if (!content) {
      toast.error("Please enter some content first.");
      return;
    }

    try {
      setSaving(true);
      await addDump({ initiativeId, content });
      setText("");
      toast.success("Idea saved!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save idea.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDump = async (dumpId: Id<"brainDumps">) => {
    try {
      const dump = displayedDumps?.find((d: any) => d._id === dumpId);
      if (dump) setLastDeletedItem(dump);
      await deleteDump({ dumpId });
      toast.success("Deleted", {
        action: dump ? {
          label: "Undo",
          onClick: () => handleRestoreDump(dump),
        } : undefined,
      });
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete.");
    }
  };

  const handleRestoreDump = async (dump: any) => {
    if (!dump || !initiativeId) return;
    try {
      setRestoring(true);
      await restoreDump({
        initiativeId,
        content: dump.content,
        originalId: dump._id,
      });
      setLastDeletedItem(null);
      toast.success("Restored!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to restore.");
    } finally {
      setRestoring(false);
    }
  };

  async function requestMicPermission() {
    try {
      const p = (navigator as any).permissions?.query
        ? await (navigator as any).permissions.query({ name: "microphone" as any })
        : null;
      if (p && p.state) {
        setMicPermission(p.state as "prompt" | "granted" | "denied");
        p.onchange = () => setMicPermission((p as any).state);
      } else {
        setMicPermission("prompt");
      }
    } catch {
      setMicPermission("prompt");
    }
  }

  async function startVoice() {
    setMicError(null);
    try {
      await requestMicPermission();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
      };
      
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
      toast.success("Recording started");
      
      setRecordingMs(0);
      if (recordingTimer) window.clearInterval(recordingTimer);
      const timerId = window.setInterval(() => {
        setRecordingMs((ms) => ms + 1000);
      }, 1000);
      setRecordingTimer(timerId as unknown as number);
    } catch (err: any) {
      const message =
        err?.name === "NotAllowedError"
          ? "Microphone access denied. Please enable mic permissions."
          : err?.name === "NotFoundError"
          ? "No microphone found on this device."
          : "Could not start recording. Please try again.";
      setMicError(message);
      toast.error(message);
    }
  }

  async function stopVoice() {
    try {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      
      if (recordingTimer) {
        window.clearInterval(recordingTimer);
        setRecordingTimer(null);
      }

      if (!audioBlob) {
        toast.error("No audio captured. Please try recording again.");
        return;
      }

      setIsUploadingAudio(true);
      setTranscriptionProgress(10);

      const uploadUrl = await generateUploadUrl({});
      setTranscriptionProgress(30);

      const res = await fetch(uploadUrl as string, {
        method: "POST",
        headers: { "Content-Type": "audio/webm" },
        body: audioBlob,
      });

      if (!res.ok) {
        throw new Error("Failed to upload audio.");
      }

      const { storageId } = await res.json();
      setTranscriptionProgress(60);

      const tr = await transcribeAudio({ fileId: storageId });
      setTranscriptionProgress(85);

      const transcript: string = tr?.transcript ?? "";
      const summary: string | undefined = tr?.summary ?? undefined;
      const tags: string[] | undefined = Array.isArray(tr?.detectedTags)
        ? tr.detectedTags
        : undefined;

      if (!businessId || !initiativeId) {
        throw new Error("Missing business or initiative context.");
      }

      await addVoiceNoteMutation({
        businessId,
        initiativeId,
        transcript: transcript || "[empty transcript]",
        summary,
        tags,
      });

      setTranscriptionProgress(100);
      toast.success("Voice note saved!");
      setAudioBlob(null);
    } catch (err: any) {
      const msg = err?.message || "Failed to process voice note.";
      toast.error(msg);
      setMicError(msg);
    } finally {
      setIsUploadingAudio(false);
      setTimeout(() => setTranscriptionProgress(0), 600);
    }
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Brain Dump & Voice Notes
        </CardTitle>
        <CardDescription>
          Capture ideas quickly via text or voice
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Text Input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Type or record an idea..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            disabled={recording || isUploadingAudio}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSaveIdea}
              disabled={saving || !text.trim() || !initiativeId}
              className="flex-1"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Idea
            </Button>
            
            {!recording ? (
              <Button
                onClick={startVoice}
                disabled={isUploadingAudio || !initiativeId}
                variant="outline"
              >
                <Mic className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={stopVoice}
                disabled={isUploadingAudio}
                variant="destructive"
              >
                <MicOff className="h-4 w-4 mr-2" />
                {formatDuration(recordingMs)}
              </Button>
            )}
          </div>
        </div>

        {/* Transcription Progress */}
        {isUploadingAudio && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing voice note...</span>
              <span>{transcriptionProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all"
                style={{ width: `${transcriptionProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Display */}
        {micError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
            {micError}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ideas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Ideas List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {displayedDumps && displayedDumps.length > 0 ? (
              displayedDumps.map((dump: any) => (
                <motion.div
                  key={dump._id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="p-3 bg-gray-50 rounded-md group hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm break-words">{dump.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(dump._creationTime).toLocaleDateString()}
                        </span>
                        {dump.tags && dump.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {dump.tags.map((tag: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteDump(dump._id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {searchQuery.trim() ? "No matching ideas found" : "No ideas yet. Start capturing!"}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Undo Last Delete */}
        {lastDeletedItem && (
          <Button
            onClick={() => handleRestoreDump(lastDeletedItem)}
            disabled={restoring}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Undo2 className="mr-2 h-4 w-4" />
            Restore Last Deleted
          </Button>
        )}
      </CardContent>
    </Card>
  );
}