import React from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type VoiceNotesProps = {
  onSave?: (payload: {
    transcript: string;
    summary?: string;
    tags?: string[];
    storageId?: string;
  }) => Promise<void> | void;
  disabled?: boolean;
  className?: string;
};

export function VoiceNotes({ onSave, disabled, className }: VoiceNotesProps) {
  const generateUploadUrl = useAction(api.files.generateUploadUrl as any);
  const transcribeAudio = useAction(api.files.transcribeAudio as any);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingMs, setRecordingMs] = React.useState(0);
  const [timerId, setTimerId] = React.useState<number | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [micError, setMicError] = React.useState<string | null>(null);
  const [transcript, setTranscript] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [audioUrl, setAudioUrl] = React.useState<string>("");

  React.useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerId) window.clearInterval(timerId);
    };
  }, [audioUrl, timerId]);

  async function startRecording() {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
      setRecordingMs(0);
      const id = window.setInterval(() => setRecordingMs((ms) => ms + 1000), 1000) as unknown as number;
      setTimerId(id);
    } catch (e: any) {
      setMicError(e?.message ?? "Microphone access denied");
      toast.error("Microphone error. Please allow mic access.");
    }
  }

  function stopRecording() {
    try {
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    } catch {}
    setIsRecording(false);
    if (timerId) {
      window.clearInterval(timerId);
      setTimerId(null);
    }
  }

  async function uploadAndTranscribe() {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    if (!blob || blob.size === 0) {
      toast.error("No audio captured.");
      return;
    }
    setUploading(true);
    setProgress(10);
    try {
      const uploadUrl: string = await generateUploadUrl({});
      setProgress(30);
      const putRes = await fetch(uploadUrl, { method: "POST", body: blob });
      if (!putRes.ok) throw new Error("Upload failed");
      setProgress(55);
      const { storageId } = (await putRes.json()) as { storageId: string };
      setProgress(70);
      const tr = (await transcribeAudio({ fileId: storageId })) as any;
      setProgress(90);
      const trText = tr?.transcript ?? "";
      const trSummary = tr?.summary ?? "";
      const trTags: string[] = Array.isArray(tr?.tags) ? tr.tags : [];
      setTranscript(trText);
      setSummary(trSummary);
      setTags(trTags.join(", "));
      setProgress(100);
      if (onSave && trText) {
        await onSave({ transcript: trText, summary: trSummary, tags: trTags, storageId });
        toast.success("Voice note saved");
      } else {
        toast.success("Transcription complete");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Transcription failed");
    } finally {
      setTimeout(() => setProgress(0), 600);
      setUploading(false);
    }
  }

  const mm = Math.floor(recordingMs / 60000)
    .toString()
    .padStart(2, "0");
  const ss = Math.floor((recordingMs % 60000) / 1000)
    .toString()
    .padStart(2, "0");

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={isRecording ? "destructive" : "default"}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || uploading}
        >
          {isRecording ? "Stop" : "Record"}
        </Button>
        <div className="text-xs text-muted-foreground">{mm}:{ss}</div>
        <Button
          size="sm"
          variant="outline"
          onClick={uploadAndTranscribe}
          disabled={disabled || uploading || isRecording || chunksRef.current.length === 0}
        >
          Transcribe
        </Button>
      </div>

      {micError && <div className="mt-2 text-xs text-red-600">{micError}</div>}

      {(uploading || progress > 0) && (
        <div className="mt-3 space-y-2">
          <Progress value={progress} />
          <div className="text-xs text-muted-foreground">
            {uploading ? `Processing… ${progress}%` : progress > 0 ? `${progress}%` : null}
          </div>
        </div>
      )}

      {audioUrl && (
        <div className="mt-3">
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}

      <div className="mt-4 space-y-2">
        <div className="text-xs font-medium">Transcript</div>
        <textarea
          className="w-full min-h-24 rounded border p-2 text-sm"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Transcribed text will appear here…"
        />
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="text-xs font-medium">Summary</div>
          <textarea
            className="w-full min-h-20 rounded border p-2 text-sm"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Optional summary…"
          />
        </div>
        <div className="space-y-2">
          <div className="text-xs font-medium">Tags (comma-separated)</div>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="ideas, follow-up, content"
          />
        </div>
      </div>
    </div>
  );
}
