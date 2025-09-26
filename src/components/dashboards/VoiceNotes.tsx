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

  const [recordingError, setRecordingError] = React.useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState<number>(0);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isTranscribing, setIsTranscribing] = React.useState(false);
  const [lastError, setLastError] = React.useState<string | null>(null);
  const [lastAudioBlob, setLastAudioBlob] = React.useState<Blob | null>(null);

  React.useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerId) window.clearInterval(timerId);
    };
  }, [audioUrl, timerId]);

  const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10MB cap

  async function startRecordingSafe() {
    try {
      setRecordingError(null);
      setLastError(null);
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
    } catch (err: any) {
      const msg = err?.message || "Microphone permission denied or unavailable.";
      setRecordingError(msg);
      toast.error(msg);
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

  async function uploadWithProgress(url: string, blob: Blob, contentType: string): Promise<void> {
    setIsUploading(true);
    setUploadProgress(0);
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url, true);
      xhr.setRequestHeader("Content-Type", contentType);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(pct);
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(100);
          resolve();
        } else {
          reject(new Error(`Upload failed with ${xhr.status}: ${xhr.statusText}`));
        }
      };
      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(blob);
    });
    setIsUploading(false);
  }

  const handleSave = React.useCallback(async (payload: {
    content: string;
    title?: string;
    summary?: string;
    tags?: string[];
    voice?: boolean;
    transcript?: string;
  }) => {
    try {
      window.dispatchEvent(new CustomEvent("voice_note_transcribed", { detail: payload }));
    } catch {
      // no-op fallback
    }
  }, []);

  const handleFinalizeRecording = React.useCallback(async (audioBlob: Blob) => {
    try {
      setLastError(null);
      setLastAudioBlob(audioBlob);

      if (audioBlob.size > MAX_AUDIO_BYTES) {
        toast.error("Recording is too large. Please keep under 10MB.");
        return;
      }

      // Get upload URL
      const { uploadUrl, storageId } = await generateUploadUrl();

      // Upload with progress
      await uploadWithProgress(uploadUrl, audioBlob, audioBlob.type || "audio/webm");
      toast("Upload complete. Transcribing...");

      // Transcribe
      setIsTranscribing(true);
      const result = await transcribeAudio({ fileId: storageId });
      setIsTranscribing(false);

      if (!result?.transcript) {
        toast.error("Transcription returned no text. Please try again.");
        return;
      }

      toast.success("Transcription complete!");
      await handleSave({
        content: result.transcript,
        title: result.title ?? "Voice Note",
        summary: result.summary,
        tags: result.detectedTags ?? [],
        voice: true,
        transcript: result.transcript,
        // audio not persisted; only transcript/summary/tags, per spec
      });
    } catch (err: any) {
      const msg = err?.message || "Failed to process voice note.";
      setLastError(msg);
      setIsTranscribing(false);
      setIsUploading(false);
      toast.error(msg);
    }
  }, [generateUploadUrl, transcribeAudio, handleSave]);

  const uploadAndTranscribe = React.useCallback(() => {
    try {
      if (!lastAudioBlob) {
        // optionally surface a toast if available in this file
        // toast.error("No prior recording found.");
        return;
      }
      void handleFinalizeRecording(lastAudioBlob);
    } catch {
      // no-op
    }
  }, [lastAudioBlob, handleFinalizeRecording]);

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
          onClick={isRecording ? stopRecording : startRecordingSafe}
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

      {recordingError && (
        <div className="text-sm text-red-600 mb-2">{recordingError}</div>
      )}

      {(isUploading || isTranscribing) && (
        <div className="flex items-center gap-3 my-2">
          <div className="text-sm text-slate-600">
            {isUploading ? `Uploading... ${uploadProgress}%` : "Transcribing..."}
          </div>
          {/* ... keep existing code (optional spinner/progress component if present) */}
        </div>
      )}

      {lastError && (
        <div className="flex flex-col gap-2 my-2">
          <div className="text-sm text-red-600">{lastError}</div>
          <div className="flex gap-2">
            <button
              className="text-sm px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => {
                if (!lastAudioBlob) {
                  toast.error("No prior recording found to retry.");
                  return;
                }
                void handleFinalizeRecording(lastAudioBlob);
              }}
            >
              Retry transcription
            </button>
            <button
              className="text-sm px-3 py-1 rounded border"
              onClick={() => setLastError(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

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