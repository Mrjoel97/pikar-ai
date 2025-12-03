// @ts-nocheck
import React, { useState, useRef, useEffect, Suspense } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Brain,
  TrendingUp,
  Users,
  Calendar,
  MessageSquare,
  Zap,
  Target,
  BarChart3,
  Mail,
  Share2,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Plus,
  Settings,
  Bell,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  X,
  Mic,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Heart,
  Share,
  Bookmark,
  Send,
  Image,
  Video,
  Link,
  Smile,
  AtSign,
  Hash,
  DollarSign,
  Percent,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Minus,
  Info,
  HelpCircle,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  ChevronsUp,
  ChevronsDown,
  MoreHorizontal,
  Menu,
  Grid,
  List,
  Layers,
  Package,
  ShoppingCart,
  CreditCard,
  Wallet,
  PieChart,
  Activity,
  Award,
  Briefcase,
  Building,
  Globe,
  MapPin,
  Phone,
  Inbox,
  Archive,
  Folder,
  File,
  FilePlus,
  FileText as FileTextIcon,
  Save,
  Printer,
  Scissors,
  Clipboard,
  Code,
  Terminal,
  Database,
  Server,
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
  Bluetooth,
  Cast,
  Monitor,
  Smartphone,
  Tablet,
  Watch,
  Headphones,
  Speaker,
  Mic as MicIcon,
  Camera,
  Aperture,
  Focus,
  Maximize,
  Minimize,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Move,
  Lock,
  Unlock,
  Key,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  LogIn,
  LogOut,
  Power,
  Loader,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { RoiDashboard } from "@/components/dashboards/RoiDashboard";
import { LazyLoadErrorBoundary } from "@/components/common/LazyLoadErrorBoundary";

// Static imports instead of lazy loading
import EmailCampaignAnalytics from "./solopreneur/EmailCampaignAnalytics";
import ContentCapsule from "./solopreneur/ContentCapsule";
import CustomerSegmentation from "./solopreneur/CustomerSegmentation";
import SocialPerformance from "./solopreneur/SocialPerformance";
import { InvoiceWidget } from "./solopreneur/InvoiceWidget";
import { ContentCalendarWidget } from "./solopreneur/ContentCalendarWidget";
import { ScheduleAssistant } from "./solopreneur/ScheduleAssistant";
import { QuickActions } from "./solopreneur/QuickActions";
import { TemplateGallery } from "./solopreneur/TemplateGallery";
import { RecentActivity } from "./solopreneur/RecentActivity";
import { HelpCoach } from "./solopreneur/HelpCoach";
import { WinsHistory } from "./solopreneur/WinsHistory";

import { 
  demoData as importedDemoData 
} from "@/lib/demoData";

function SolopreneurDashboard({ business: businessProp }: { business?: any }) {
  // Use auth status early to guard queries when not authenticated
  const { isAuthenticated: isAuthed } = useAuth();
  
  // Fetch current user data
  const user = useQuery(api.users.currentUser, isAuthed ? {} : "skip");
  
  // Determine if user is in guest mode
  const isGuest = !isAuthed;
  
  // Use business from prop
  const business = businessProp;
  
  // Add navigation hook
  const navigate = useNavigate();
  
  // Add onUpgrade callback function
  const onUpgrade = () => {
    navigate("/pricing");
  };
  
  // Add local BrainDumpSection component
  function BrainDumpSection({ businessId }: { businessId: string }) {
    // Get or create an initiative for the business (we'll read the first one)
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
    const updateTags = useMutation(api.initiatives.updateBrainDumpTags as any);
    const softDelete = useMutation(api.initiatives.softDeleteBrainDump as any);
    const restoreDump = useMutation(api.initiatives.restoreBrainDump as any);

    const [text, setText] = React.useState("");
    const [saving, setSaving] = React.useState(false);
    const [transcript, setTranscript] = React.useState("");
    const [summary, setSummary] = React.useState("");
    // Add filter state for tag chips
    const [activeTagFilter, setActiveTagFilter] = React.useState<
      "" | "content" | "offer" | "ops"
    >("");

    // Add: inline save handler for typed idea
    const handleSaveIdeaInline = async () => {
      if (!initiativeId) {
        toast("No initiative found. Run Phase 0 setup first.");
        return;
      }
      const content = (text || summary || transcript).trim();
      if (!content) {
        toast("Type an idea first.");
        return;
      }
      try {
        setSaving(true);
        const tags = tagIdea(content);
        if (addVoiceDump) {
          await addVoiceDump({
            initiativeId,
            content,
            transcript: transcript || undefined,
            summary: summary || undefined,
            tags,
          });
        } else {
          await addDump({ initiativeId, content });
        }
        setText("");
        toast.success("Saved idea.");
      } catch (e: any) {
        toast.error(e?.message || "Failed to save idea.");
      } finally {
        setSaving(false);
      }
    };

    // Add local loading state for restore
    /* Duplicate removed — reuse the already-declared `lastDeletedItem` and `setLastDeletedItem` */

    // Search brain dumps
    const [searchQuery, setSearchQuery] = useState("");
    const searchArgs = useMemo(
      () =>
        initiative?._id
          ? {
              initiativeId: initiative._id,
              q: searchQuery,
              limit: 5,
            }
          : "skip",
      [initiative?._id, searchQuery],
    );
    const searchResults = useQuery(api.initiatives.searchBrainDumps, searchArgs);

    // Audio recording + upload + transcription
    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
    const chunksRef = React.useRef<Blob[]>([]);
    const [audioUrl, setAudioUrl] = React.useState<string>("");
    const [uploading, setUploading] = React.useState(false);
    const getUploadUrl = useAction(api.files.getUploadUrl as any);
    /* removed duplicate voice notes robustness state block */

    // Request mic permission upfront to provide clearer UX and actionable errors.
    async function requestMicPermission() {
      try {
        // Some browsers implement navigator.permissions for microphone; gracefully fallback
        const p = (navigator as any).permissions?.query
          ? await (navigator as any).permissions.query({
              name: "microphone" as any,
            })
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

    // Start recording: handle permission denial and surface nice errors.
    // This replaces the previous startVoice with a more robust version.
    async function startVoice() {
      setMicError(null);
      try {
        await requestMicPermission();
        // Try to get microphone; surface error if not available or denied
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
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
        toast("Recording started");
        // Start duration timer
        setRecordingMs(0);
        if (recordingTimer) {
          window.clearInterval(recordingTimer);
        }
        const timerId = window.setInterval(() => {
          setRecordingMs((ms) => ms + 1000);
        }, 1000);
        setRecordingTimer(timerId as unknown as number);
      } catch (err: any) {
        const message =
          err?.name === "NotAllowedError"
            ? "Microphone access was denied. Please enable mic permissions in your browser settings."
            : err?.name === "NotFoundError"
              ? "No microphone was found on this device."
              : "Could not start recording. Please try again.";
        setMicError(message);
        toast.error(message);
      }
    }

    // Stop recording, upload audio, transcribe with progress, and save as a Brain Dump.
    // This replaces the previous stopVoice with a more robust version.
    async function stopVoice() {
      try {
        // Stop the recorder, get recorded Blob named audioBlob
        mediaRecorderRef.current?.stop();
        // Clear timer
        if (recordingTimer) {
          window.clearInterval(recordingTimer);
          setRecordingTimer(null);
        }
        // Upload + transcribe
        if (typeof audioBlob === "undefined" || !audioBlob) {
          toast.error("No audio captured. Please try recording again.");
          return;
        }
        setIsUploadingAudio(true);
        setTranscriptionProgress(10);
        // 1) Generate upload URL
        const uploadUrl = await generateUploadUrl({});
        setTranscriptionProgress(30);
        // 2) Upload to Convex storage
        const res = await fetch(uploadUrl as string, {
          method: "POST",
          headers: { "Content-Type": "audio/webm" },
          body: audioBlob,
        });
        if (!res.ok) {
          setIsUploadingAudio(false);
          setTranscriptionProgress(0);
          const text = await res.text();
          throw new Error(text || "Failed to upload audio.");
        }
        const { storageId } = await res.json();
        setTranscriptionProgress(60);
        // 3) Transcribe
        const tr = await transcribeAudio({ fileId: storageId });
        setTranscriptionProgress(85);
        // 4) Persist as Brain Dump (voice note)
        const transcript: string = tr?.transcript ?? "";
        const summary: string | undefined = tr?.summary ?? undefined;
        const tags: string[] | undefined = Array.isArray(tr?.detectedTags)
          ? tr.detectedTags
          : undefined;

        // ... keep existing code (find businessId & initiativeId currently in scope)
        if (!businessId || !initiativeId) {
          throw new Error(
            "Missing business or initiative context to save voice note.",
          );
        }
        await addVoiceNoteMutation({
          businessId,
          initiativeId,
          transcript: transcript || "[empty transcript]",
          summary,
          tags,
        });
        setTranscriptionProgress(100);
        toast.success("Voice note saved.");
      } catch (err: any) {
        const msg = err?.message || "Failed to process voice note.";
        toast.error(msg);
        setMicError(msg);
      } finally {
        setIsUploadingAudio(false);
        // Reset progress after a short delay for visual feedback
        setTimeout(() => setTranscriptionProgress(0), 600);
      }
    }

    // Retry helper: clear error and attempt to start again.
    function retryVoice() {
      setMicError(null);
      startVoice();
    }

    // Add: inline save handler for typed idea
    const handleSaveIdea = async () => {
      if (!initiativeId) {
        toast("No initiative found. Run Phase 0 setup first.");
        return;
      }
      const content = (text || summary || transcript).trim();
      if (!content) {
        toast("Type an idea first.");
        return;
      }
      try {
        setSaving(true);
        const tags = tagIdea(content);
        if (addVoiceDump) {
          await addVoiceDump({
            initiativeId,
            content,
            transcript: transcript || undefined,
            summary: summary || undefined,
            tags,
          });
        } else {
          await addDump({ initiativeId, content });
        }
        setText("");
        toast.success("Saved idea.");
      } catch (e: any) {
        toast.error(e?.message || "Failed to save idea.");
      } finally {
        setSaving(false);
      }
    };

    // Add local loading state for restore
    const [lastDeletedItem, setLastDeletedItem] = React.useState<any | null>(
      null,
    );

    // Correctly skip when args are undefined
    /* searchQuery and searchArgsMemoSearch moved earlier to avoid TDZ error */

    // Audio recording + upload + transcription
    // const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
    // const chunksRef = React.useRef<Blob[]>([]);
    // const [audioUrl, setAudioUrl] = React.useState<string>("");
    // const [uploading, setUploading] = React.useState(false);
    // const getUploadUrl = useAction(api.files.getUploadUrl as any);
    /* removed duplicate voice notes robustness state block */

    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
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
        toast("Recording started");
      } catch (e: any) {
        toast.error(e?.message ?? "Mic permission denied");
      }
    };

    const stopRecording = () => {
      try {
        mediaRecorderRef.current?.stop();
        toast("Recording stopped");
      } catch {}
    };

    const handleUploadAndTranscribe = async () => {
      if (!audioUrl) {
        toast("Record audio first");
        return;
      }
      if (!initiativeId) {
        toast("No initiative found. Run setup first.");
        return;
      }
      try {
        setUploading(true);
        const res = await fetch(audioUrl);
        const blob = await res.blob();

        const { url } = (await getUploadUrl({})) as any;
        const putRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": blob.type || "application/octet-stream" },
          body: blob,
        });
        if (!putRes.ok) throw new Error("Upload failed");
        const uploaded = await putRes.json(); // { storageId }
        const fileId = uploaded.storageId;

        const tx = (await transcribeAudio({ fileId })) as any;
        const tTranscript = tx?.transcript || "";
        const tSummary = tx?.summary || "";

        const tags = tagIdea((tSummary || tTranscript).trim());
        if (addVoiceDump) {
          await addVoiceDump({
            initiativeId,
            content: (text || tSummary || tTranscript || "Voice note").trim(),
            transcript: tTranscript || undefined,
            summary: tSummary || undefined,
            tags,
            audioFileId: fileId,
          } as any);
        } else {
          await addDump({
            initiativeId,
            content: tSummary || "Voice note",
          } as any);
        }
        setText("");
        toast.success("Voice note uploaded and saved.");
      } catch (e: any) {
        toast.error(e?.message ?? "Upload/transcription failed");
      } finally {
        setUploading(false);
      }
    };

    return (
      <Card className="p-4 mt-6">
        {/* Header + quick controls */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Brain Dump</h3>
            <span className="text-xs text-muted-foreground">
              Capture rough ideas quickly
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search ideas (content, transcript, summary)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-56"
            />
          </div>
        </div>

        <Separator className="my-3" />

        {/* Voice: browser speech + audio recording */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Button
            size="sm"
            variant={isRecording ? "default" : "outline"}
            className={
              isRecording
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : ""
            }
            onClick={isRecording ? stopVoice : startVoice}
          >
            {isRecording ? "Stop Voice Recognition" : "Voice Recognition"}
          </Button>

          <Button
            size="sm"
            variant={mediaRecorderRef.current ? "default" : "outline"}
            className={
              mediaRecorderRef.current
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : ""
            }
            onClick={mediaRecorderRef.current ? stopRecording : startRecording}
          >
            {mediaRecorderRef.current ? "Stop Recording" : "Record Audio"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleUploadAndTranscribe}
            disabled={uploading || !initiativeId}
          >
            {uploading ? "Uploading..." : "Upload & Transcribe"}
          </Button>

          {audioUrl && <audio src={audioUrl} controls className="h-9" />}

          {transcript && <Badge variant="outline">Transcript ready</Badge>}
          {detectedTags.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Tags:</span>
              {detectedTags.map((t) => (
                <Badge
                  key={`detected_${t}`}
                  variant="secondary"
                  className="capitalize"
                >
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* removed duplicate Voice Notes robustness UI block */}

        {transcript && (
          <div className="text-xs text-muted-foreground mb-2">
            <span className="font-medium">Heard:</span> {transcript}
          </div>
        )}
        {summary && (
          <div className="text-xs text-muted-foreground mb-2">
            <span className="font-medium">Summary:</span> {summary}
          </div>
        )}
        <Textarea
          placeholder="Write freely here... (e.g., campaign idea, positioning, offer notes)"
          value={text}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setText(e.target.value)
          }
          className="min-h-24"
        />
        <div className="flex justify-end gap-2">
          {summary && (
            <Button
              variant="outline"
              onClick={handleSaveIdea}
              disabled={saving || !initiativeId}
            >
              {saving ? "Saving..." : "Save Voice Idea"}
            </Button>
          )}
          <Button onClick={handleSaveIdea} disabled={saving || !initiativeId}>
            {saving ? "Saving..." : "Save Idea"}
          </Button>
        </div>

        <Separator className="my-4" />

        {/* Filter chips */}
        <div className="text-sm font-medium">Recent ideas</div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground">Filter:</span>
          {(["", "content", "offer", "ops"] as const).map((tag) => (
            <Button
              key={`tag_${tag || "all"}`}
              size="sm"
              variant={activeTagFilter === tag ? "default" : "outline"}
              className={
                activeTagFilter === tag
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : ""
              }
              onClick={() => setActiveTagFilter(tag as any)}
            >
              {tag || "All"}
            </Button>
          ))}
        </div>

        {/* Results: if searching, show results; else show default list */}
        {searchQuery.trim() && Array.isArray(searchResults) ? (
          <div className="space-y-2">
            {searchResults.map((d: any) => (
              <div
                key={d._id?.toString() || `dump-${Math.random()}`}
                className="rounded-md border p-3 text-sm"
              >
                <div className="text-muted-foreground text-xs mb-1">
                  {new Date(d.createdAt).toLocaleString()}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  {(Array.isArray(d.tags) && d.tags.length > 0
                    ? d.tags
                    : tagIdea(String(d.content || ""))
                  ).map((t: string) => (
                    <Badge
                      key={`${d._id?.toString() || 'dump'}_${t}`}
                      variant="outline"
                      className="capitalize"
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
                <div className="whitespace-pre-wrap">{d.content}</div>
                {d.transcript && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Transcript: {d.transcript}
                  </div>
                )}
                {/* Actions: create workflow, edit tags, soft delete */}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCreateWorkflowFromIdea(d.content)}
                  >
                    Create workflow
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const cur = Array.isArray(d.tags) ? d.tags.join(",") : "";
                      const next = window.prompt(
                        "Edit tags (comma-separated):",
                        cur,
                      );
                      if (next === null) return;
                      const tags = next
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);
                      try {
                        await updateTags({ brainDumpId: d._id, tags } as any);
                        toast.success("Tags updated");
                      } catch (e: any) {
                        toast.error(e?.message ?? "Failed to update tags");
                      }
                    }}
                  >
                    Edit tags
                  </Button>
                  {!d.deletedAt ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await softDelete({ brainDumpId: d._id } as any);
                          setLastDeletedItem({
                            id: d._id,
                            content: d.content,
                            tags: d.tags,
                            createdAt: d.createdAt,
                          });
                          toast("Moved to trash");
                        } catch (e: any) {
                          toast.error(e?.message ?? "Failed to delete");
                        }
                      }}
                    >
                      Delete
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await restoreDump({ brainDumpId: d._id } as any);
                          toast.success("Restored");
                        } catch (e: any) {
                          toast.error(e?.message ?? "Failed to restore");
                        }
                      }}
                    >
                      Restore
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {searchResults.length === 0 && (
              <div className="text-muted-foreground text-sm">
                No results for your search.
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {Array.isArray(dumps) && dumps.length > 0 ? (
              dumps
                .filter((d: any) => !d.deletedAt)
                .filter((d: any) => {
                  if (!activeTagFilter) return true;
                  const inferred =
                    Array.isArray(d.tags) && d.tags.length > 0
                      ? d.tags
                      : tagIdea(String(d.content || ""));
                  return inferred.includes(activeTagFilter as any);
                })
                .map((d: any) => (
                  <div
                    key={d._id?.toString() || `dump-${Math.random()}`}
                    className="rounded-md border p-3 text-sm"
                  >
                    <div className="text-muted-foreground text-xs mb-1">
                      {new Date(d.createdAt).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      {(Array.isArray(d.tags) && d.tags.length > 0
                        ? d.tags
                        : tagIdea(String(d.content || ""))
                      ).map((t: string) => (
                        <Badge
                          key={`${d._id?.toString() || 'dump'}_${t}`}
                          variant="outline"
                          className="capitalize"
                        >
                          {t}
                        </Badge>
                      ))}
                    </div>
                    <div className="whitespace-pre-wrap">{d.content}</div>
                    {d.transcript && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Transcript: {d.transcript}
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCreateWorkflowFromIdea(d.content)}
                      >
                        Create workflow
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const cur = Array.isArray(d.tags)
                            ? d.tags.join(",")
                            : "";
                          const next = window.prompt(
                            "Edit tags (comma-separated):",
                            cur,
                          );
                          if (next === null) return;
                          const tags = next
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);
                          try {
                            await updateTags({
                              brainDumpId: d._id,
                              tags,
                            } as any);
                            toast.success("Tags updated");
                          } catch (e: any) {
                            toast.error(e?.message ?? "Failed to update tags");
                          }
                        }}
                      >
                        Edit tags
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-2"
                        onClick={async () => {
                          try {
                            await softDelete({ brainDumpId: d._id } as any);
                            setLastDeletedItem({
                              id: d._id,
                              content: d.content,
                              tags: d.tags,
                              createdAt: d.createdAt,
                            });
                            toast("Moved to trash");
                          } catch (e: any) {
                            toast.error(e?.message ?? "Failed to delete");
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-muted-foreground text-sm">
                No entries yet.
              </div>
            )}
            {lastDeletedItem && (
              <div className="mb-3 flex items-center justify-between rounded-md border p-2 bg-amber-50 text-amber-800">
                <span className="text-xs">Idea moved to trash.</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await restoreDump({
                          brainDumpId: lastDeletedItem.id,
                        } as any);
                        setLastDeletedItem(null);
                        toast.success("Restored");
                      } catch (e: any) {
                        toast.error(e?.message ?? "Failed to restore");
                      }
                    }}
                  >
                    Undo
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setLastDeletedItem(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bulk tag merge (simple CTA) */}
        {initiativeId && (
          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const fromTag = window.prompt("Merge FROM tag:");
                if (!fromTag) return;
                const toTag = window.prompt(`Merge "${fromTag}" INTO tag:`);
                if (!toTag) return;
                try {
                  await (
                    useMutation(
                      api.initiatives.mergeTagsForInitiative as any,
                    ) as any
                  )({
                    initiativeId,
                    fromTag,
                    toTag,
                  });
                  toast.success("Tags merged");
                } catch (e: any) {
                  toast.error(e?.message ?? "Failed to merge tags");
                }
              }}
            >
              Merge Tags
            </Button>
          </div>
        )}
      </Card>
    );
  }

  // Add helper: local usage and streaks
  function useTemplateOrderingAndStreak() {
    const [streak, setStreak] = React.useState<number>(0);
    const [timeSavedTotal, setTimeSavedTotal] = React.useState<number>(0);
    // New: local wins history
    const [history, setHistory] = React.useState<
      Array<{
        at: string;
        type: string;
        minutes: number;
        meta?: Record<string, any>;
      }>
    >([]);

    React.useEffect(() => {
      const rawDates = localStorage.getItem("pikar.winDates");
      const dates: string[] = rawDates ? JSON.parse(rawDates) : [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let s = 0;
      for (;;) {
        const d = new Date(today);
        d.setDate(today.getDate() - s);
        const key = d.toISOString().slice(0, 10);
        if (dates.includes(key)) s += 1;
        else break;
      }
      setStreak(s);

      const ts = Number(localStorage.getItem("pikar.timeSavedTotal") || "0");
      setTimeSavedTotal(ts);

      const rawHist = localStorage.getItem("pikar.winHistory");
      const hist: Array<{
        at: string;
        type: string;
        minutes: number;
        meta?: Record<string, any>;
      }> = rawHist ? JSON.parse(rawHist) : [];
      setHistory(hist);
    }, []);

    const recordLocalWin = (
      minutes: number,
      type: string = "generic",
      meta?: Record<string, any>,
    ) => {
      const nowIso = new Date().toISOString();
      const todayKey = nowIso.slice(0, 10);
      const rawDates = localStorage.getItem("pikar.winDates");
      const dates: string[] = rawDates ? JSON.parse(rawDates) : [];
      if (!dates.includes(todayKey)) dates.push(todayKey);
      localStorage.setItem("pikar.winDates", JSON.stringify(dates));
      const ts =
        Number(localStorage.getItem("pikar.timeSavedTotal") || "0") + minutes;
      localStorage.setItem("pikar.timeSavedTotal", String(ts));
      setTimeSavedTotal(ts);

      const rawHist = localStorage.getItem("pikar.winHistory");
      const hist: Array<{
        at: string;
        type: string;
        minutes: number;
        meta?: Record<string, any>;
      }> = rawHist ? JSON.parse(rawHist) : [];
      hist.unshift({ at: nowIso, type, minutes, meta });
      localStorage.setItem(
        "pikar.winHistory",
        JSON.stringify(hist.slice(0, 100)),
      );
      setHistory(hist.slice(0, 100));
    };

    const clearLocalWins = () => {
      localStorage.removeItem("pikar.winDates");
      localStorage.removeItem("pikar.timeSavedTotal");
      localStorage.removeItem("pikar.winHistory");
      setStreak(0);
      setTimeSavedTotal(0);
      setHistory([]);
    };

    const bumpTemplateUsage = (key: string) => {
      const raw = localStorage.getItem("pikar.templateUsageCounts");
      const map: Record<string, number> = raw ? JSON.parse(raw) : {};
      map[key] = (map[key] || 0) + 1;
      localStorage.setItem("pikar.templateUsageCounts", JSON.stringify(map));
    };

    const orderTemplates = <T extends { key: string }>(list: T[]): T[] => {
      const raw = localStorage.getItem("pikar.templateUsageCounts");
      const map: Record<string, number> = raw ? JSON.parse(raw) : {};
      return [...list].sort((a, b) => (map[b.key] || 0) - (map[a.key] || 0));
    };

    return {
      streak,
      timeSavedTotal,
      history,
      recordLocalWin,
      clearLocalWins,
      bumpTemplateUsage,
      orderTemplates,
    };
  }

  // Use Convex KPI snapshot when authenticated; fallback to demo data for guests
  const kpiDoc = useQuery(
    api.kpis.getSnapshot,
    !isGuest && businessId ? { businessId: businessId } : undefined
  );

  // Use demo data when in guest mode
  const agents = isGuest ? importedDemoData?.agents || [] : [];
  const workflows = isGuest ? importedDemoData?.workflows || [] : [];
  const kpis = isGuest ? importedDemoData?.kpis || {} : kpiDoc || {};
  const tasks = isGuest ? importedDemoData?.tasks || [] : [];
  const notifications = isGuest ? importedDemoData?.notifications || [] : [];
  // removed duplicate kpis declaration; using kpiDoc fallback above

  // Add: Quick Analytics (Convex) with safe fallback for guests/no business
  const quickAnalytics =
    !isGuest && business?._id
      ? (useQuery as any)(api.solopreneur.runQuickAnalytics, {
          businessId: business?._id,
        })
      : {
          revenue90d: 0,
          churnAlert: false,
          topProducts: [] as Array<{ name: string }>,
          deltas: {
            revenue: 0,
            subscribers: 0,
            engagement: 0,
          },
        };

  // Limit "Today's Focus" to max 3 tasks
  const focusTasks = Array.isArray(tasks) ? tasks.slice(0, 3) : [];

  // Simple helper for fallback values
  const fmtNum = (n: any, digits = 0) => {
    const v = typeof n === "number" ? n : 0;
    return v.toLocaleString(undefined, { maximumFractionDigits: digits });
  };

  // Derived KPI percents for simple snapshot bars
  const snapshot = {
    visitors: { value: kpis.visitors ?? 1250, delta: kpis.visitorsDelta ?? 5 },
    subscribers: {
      value: kpis.subscribers ?? 320,
      delta: quickAnalytics?.deltas?.subscribers ?? kpis.subscribersDelta ?? 3,
    },
    engagement: {
      value: kpis.engagement ?? 62,
      delta: quickAnalytics?.deltas?.engagement ?? kpis.engagementDelta ?? 2,
    }, // %
    revenue: {
      value: kpis.revenue ?? kpis.totalRevenue ?? 12500,
      delta: quickAnalytics?.deltas?.revenue ?? kpis.revenueDelta ?? 4,
    }, // $
    taskCompletion: { value: kpis.taskCompletion ?? 89, delta: 0 }, // %
    activeCustomers: { value: kpis.activeCustomers ?? 45, delta: 0 },
    conversionRate: { value: kpis.conversionRate ?? 3.2, delta: 0 }, // %
  };

  // Add mutations for One-Click Setup
  const initAgent = useMutation(api.solopreneur.initSolopreneurAgent);
  const seedTemplates = useMutation(api.solopreneur.seedOneClickTemplates);

  // Add: Top-level initiative + brain dump data for Today's Focus suggestions
  const initiativesTop =
    !isGuest && business?._id
      ? (useQuery as any)(api.initiatives.getByBusiness, {
          businessId: business?._id,
        })
      : undefined;
  const currentInitiative =
    Array.isArray(initiativesTop) && initiativesTop.length > 0
      ? initiativesTop[0]
      : undefined;
  const brainDumps = currentInitiative?._id
    ? (useQuery as any)(api.initiatives.listBrainDumpsByInitiative, {
        initiativeId: currentInitiative?._id,
        limit: 10,
      })
    : [];

  // Add: actions/mutations and local state for Support Triage + Privacy controls
  const suggest = useAction(api.solopreneur.supportTriageSuggest);
  const forgetUploads = useMutation(api.solopreneur.forgetUploads);
  const [emailBody, setEmailBody] = useState<string>("");
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageSuggestions, setTriageSuggestions] = useState<
    Array<{ label: string; reply: string; priority: "low" | "medium" | "high" }>
  >([]);

  // Add missing state and mutation for Quick‑add Brain Dump
  const [quickIdea, setQuickIdea] = useState<string>("");
  const [savingQuickIdea, setSavingQuickIdea] = useState<boolean>(false);
  const addDumpTop = useMutation(api.initiatives.addBrainDump as any);

  // Invoice state already declared above - removed duplicate
  const generateInvoicePdf = useAction(api.invoicesActions.generateInvoicePdf);
  const generateSocialContent = useAction(api.socialContentAgent.generateSocialContent);

  // Local loading state
  const [settingUp, setSettingUp] = useState(false);

  // Templates strip (client-side, mirrors the seeded presets)
  const myTemplates: Array<{
    key: string;
    name: string;
    description: string;
    tag: string;
  }> = [
    {
      name: "Solopreneur — Launch Post",
      description: "Announce a new offering with a friendly, concise tone.",
      tag: "social",
      key: "solopreneur_launch_post",
    },
    {
      name: "Solopreneur — Weekly Newsletter",
      description: "Lightweight weekly update to nurture your audience.",
      tag: "email",
      key: "solopreneur_weekly_newsletter",
    },
    {
      name: "Solopreneur — Product Highlight",
      description: "Quick product spotlight with clear CTA.",
      tag: "cta",
      key: "solopreneur_product_highlight",
    },
  ];

  const handleUseTemplate = (t: { name: string }) => {
    if (isGuest) {
      toast("Sign in to use templates.");
      onUpgrade?.();
      return;
    }
    // Navigate to Workflows where templates can be copied/used
    toast.success(`Opening Workflows — "${t.name}" is ready to use.`);
    navigate("/workflows");
  };

  // Add: load Agent Profile v2 to wire tone/persona/cadence into composer
  const agentProfile = useQuery(
    api.agentProfile.getMyAgentProfile,
    business ? { businessId: business?._id } : ("skip" as any),
  );
  const upsertAgent = useMutation(api.agentProfile.upsertMyAgentProfile as any);
  const saveAgentProfile = async (partial: {
    tone?: "concise" | "friendly" | "premium";
    persona?: "maker" | "coach" | "executive";
    cadence?: "light" | "standard" | "aggressive";
  }) => {
    if (!business?._id) {
      toast("Create a business first.");
      return;
    }
    try {
      await upsertAgent({ businessId: business?._id, ...partial });
      toast.success("Agent profile updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save agent profile");
    }
  };

  // Add: Schedule a simple "Post" quick action using schedule.addSlot
  const addSlot = useMutation(api.schedule.addSlot);
  const handleQuickPost = async () => {
    try {
      const when = Date.now() + 15 * 60 * 1000; // 15 minutes from now
      await addSlot({
        businessId: business?._id,
        label: "Quick Post",
        channel: "post",
        scheduledAt: when,
      });
      toast.success(`Post scheduled for ${new Date(when).toLocaleString()}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to schedule post");
    }
  };

  // Handler for One-Click Setup
  const handleOneClickSetup = async () => {
    if (isGuest) {
      toast("Please sign in to run setup.");
      onUpgrade?.();
      return;
    }
    try {
      setSettingUp(true);
      toast("Initializing your solopreneur agent...");

      const initRes = await initAgent({
        businessId: business?._id,
      } as any);

      const resolvedBusinessId =
        (initRes && (initRes as any).businessId) || business?._id;

      toast("Seeding one-click templates...");
      const seedRes = await seedTemplates({
        businessId: resolvedBusinessId,
      } as any);

      const created = (seedRes as any)?.created ?? 0;
      toast.success(`Setup complete! ${created} templates ready to use.`);
    } catch (e: any) {
      toast.error(e?.message || "Setup failed. Please try again.");
    } finally {
      setSettingUp(false);
    }
  };

  // Quick actions (guest -> prompt sign-in, authed -> future: navigate)
  const handleQuickAction = (action: string) => {
    if (isGuest) {
      alert("Sign in to use this action");
      onUpgrade?.();
      return;
    }
    
    if (action === "Social Media") {
      setShowSocialModal(true);
      return;
    }
    
    // Future: route to real features
    alert(`${action} coming soon`);
  };

  const handleGenerateSocialContent = async () => {
    if (!business?._id || !user?._id) {
      toast.error("Please sign in to generate content");
      return;
    }

    if (!socialContent.trim()) {
      toast.error("Please enter a topic or idea");
      return;
    }

    try {
      setGeneratingSocial(true);
      const result = await generateSocialContent({
        businessId: business?._id,
        userId: user?._id,
        topic: socialContent,
        platforms: socialPlatforms.length > 0 ? socialPlatforms : ["twitter"],
        tone: "professional",
      });

      if (result.success && result.content) {
        setSocialContent(result.content);
        toast.success("Content generated successfully!");
      } else {
        toast.error("Failed to generate content");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to generate content");
    } finally {
      setGeneratingSocial(false);
    }
  };

  const handleRepurposeBlogToSocial = async () => {
    if (!business?._id || !user?._id) {
      toast.error("Please sign in to repurpose content");
      return;
    }

    try {
      setGeneratingSocial(true);
      const result = await generateSocialContent({
        businessId: business?._id,
        userId: user?._id,
        topic: "Repurpose my latest blog post into social media content",
        platforms: ["twitter", "linkedin"],
        tone: "professional",
      });

      if (result.success && result.content) {
        setSocialContent(result.content);
        setShowSocialModal(true);
        toast.success("Blog repurposed to social content!");
      } else {
        toast.error("Failed to repurpose content");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to repurpose content");
    } finally {
      setGeneratingSocial(false);
    }
  };

  const handleSuggestReplies = async () => {
    if (!emailBody.trim()) {
      toast("Paste an email to get suggestions.");
      return;
    }
    try {
      setTriageLoading(true);
      const res = await suggest({ body: emailBody });
      const items = (res as any)?.suggestions ?? [];
      setTriageSuggestions(items);
      toast.success(
        `Generated ${items.length} suggestion${items.length === 1 ? "" : "s"}.`,
      );
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to generate suggestions.");
    } finally {
      setTriageLoading(false);
    }
  };

  const handleForgetUploads = async () => {
    if (isGuest) {
      toast("Sign in to manage your uploads.");
      onUpgrade?.();
      return;
    }
    try {
      const res = await forgetUploads({});
      const count = (res as any)?.deleted ?? 0;
      toast.success(
        `Cleared ${count} upload${count === 1 ? "" : "s"} and reset agent doc refs.`,
      );
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to clear uploads.");
    }
  };

  // Add helper: local usage and streaks
  const createFromIdea = useMutation(api.workflows.createQuickFromIdea);
  const logWin = useMutation(api.audit.logWin);

  // Example state you likely already have: businessId, initiativeId, brain dumps, myTemplates, navigate, etc.
  // We'll add new handlers:

  // Create workflow from a brain dump item
  const handleCreateWorkflowFromIdea = async (ideaText: string) => {
    try {
      if (!business?._id) {
        toast("Please select or create a business first.");
        return;
      }
      const id = await createFromIdea({
        businessId: business?._id,
        idea: ideaText,
        initiativeId: currentInitiative?._id,
      });
      // Log a win: estimate 20 minutes saved for skipping setup
      await logWin({
        businessId: business?._id,
        winType: "workflow_created_from_idea",
        timeSavedMinutes: 20,
        details: { workflowId: String(id) },
      });
      utils.recordLocalWin(20, "workflow_created_from_idea", {
        source: "brain_dump",
      });
      toast("Workflow created from idea!");
      navigate("/workflows");
    } catch (e: any) {
      toast(e.message || "Failed to create workflow.");
    }
  };

  // Smart ordering for "My Templates" and local streak/time saved view
  const utils = useTemplateOrderingAndStreak();
  // If you already have myTemplates defined, wrap it:
  const orderedTemplates = React.useMemo(
    () => utils.orderTemplates(myTemplates),
    [myTemplates],
  );

  // NEW: Template pinning persistence
  const pinnedList = useQuery(
    api.templatePins.listPinned as any,
    isGuest || !isAuthed ? ("skip" as any) : {},
  ) as any[] | undefined;
  const togglePin = useMutation(api.templatePins.togglePin as any);
  const pinnedSet = React.useMemo(() => {
    const ids = new Set<string>();
    if (Array.isArray(pinnedList)) {
      for (const p of pinnedList) {
        const id = String((p as any)?.templateId || "");
        if (id) ids.add(id);
      }
    }
    return ids;
  }, [pinnedList]);

  const handlePinTemplate = async (tplKey: string, nextPin: boolean) => {
    try {
      await togglePin({ templateId: tplKey, pin: nextPin } as any);
      toast(nextPin ? "Pinned template" : "Unpinned template");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update pin");
    }
  };

  // Sort pinned first, then by usage ordering
  const orderedTemplatesWithPins = React.useMemo(() => {
    const list = [...orderedTemplates];
    list.sort((a, b) => {
      const ap = pinnedSet.has(a.key) ? 1 : 0;
      const bp = pinnedSet.has(b.key) ? 1 : 0;
      // pinned first
      if (ap !== bp) return bp - ap;
      return 0;
    });
    return list;
  }, [orderedTemplates, pinnedSet]);

  // Template Gallery modal state
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryQuery, setGalleryQuery] = useState("");

  // Help Coach tips (dismissable)
  const coachTips: Array<{ id: string; text: string }> = [
    {
      id: "tip_focus",
      text: "Pick one high‑impact task to ship today — momentum compounds.",
    },
    {
      id: "tip_templates",
      text: "Use templates to publish faster — tweak, don't start from scratch.",
    },
    {
      id: "tip_ideas",
      text: "Turn a Brain Dump idea into a workflow when it's actionable.",
    },
  ];
  const [dismissedTips, setDismissedTips] = useState<Record<string, boolean>>(
    {},
  );
  const visibleTips = coachTips.filter((t) => !dismissedTips[t.id]);

  // Add state for Schedule Assistant (Week 4)
  const [scheduleOpen, setScheduleOpen] = useState(false);
  // Add: per-channel filter for Schedule Assistant and bulk add
  const [channelFilter, setChannelFilter] = useState<"All" | "Post" | "Email">(
    "All",
  );
  // Add missing state used by Schedule Assistant bulk-add flow
  const [addingAll, setAddingAll] = useState(false);
  
  // Add state for AI-generated suggestions
  const [aiSuggestions, setAiSuggestions] = useState<Array<{
    label: string;
    when: string;
    channel: "post" | "email";
    scheduledAt: number;
    reasoning: string;
  }> | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  // Backend action for AI-powered suggestions
  const suggestOptimalSlots = useAction(api.schedule.suggestOptimalSlots);
  
  // Load AI suggestions when dialog opens
  React.useEffect(() => {
    if (scheduleOpen && !isGuest && business?._id && !aiSuggestions) {
      setLoadingSuggestions(true);
      suggestOptimalSlots({
        businessId: business?._id,
        cadence: agentProfile?.cadence,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
        .then((result) => {
          setAiSuggestions(result.slots);
          if (!result.aiGenerated) {
            toast.info("Using default suggestions (AI unavailable)");
          }
        })
        .catch((err) => {
          toast.error("Failed to load AI suggestions");
        })
        .finally(() => {
          setLoadingSuggestions(false);
        });
    }
  }, [scheduleOpen, isGuest, business?._id, aiSuggestions, agentProfile?.cadence]);
  
  // Compute suggested schedule slots - use AI suggestions if available, fallback to local
  const suggestedSlots: Array<{
    label: string;
    when: string;
    channel: "Post" | "Email";
    scheduledAt?: number;
    reasoning?: string;
  }> = React.useMemo(() => {
    // Use AI suggestions if available
    if (aiSuggestions && aiSuggestions.length > 0) {
      return aiSuggestions.map(s => ({
        label: s.label,
        when: s.when,
        channel: s.channel === "post" ? "Post" : "Email",
        scheduledAt: s.scheduledAt,
        reasoning: s.reasoning,
      }));
    }
    
    // Fallback to local computation
    const base = new Date();
    const toDateString = (d: Date) =>
      d.toLocaleString(undefined, {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    const nextDow = (targetDow: number, hour: number) => {
      const d = new Date(base);
      const diff = (targetDow + 7 - d.getDay()) % 7 || 7; // always future
      d.setDate(d.getDate() + diff);
      d.setHours(hour, 0, 0, 0);
      return d;
    };
    const cadence = agentProfile?.cadence || "standard";
    const list: Array<{
      label: string;
      when: string;
      channel: "Post" | "Email";
      scheduledAt?: number;
      reasoning?: string;
    }> = [];
    // Baseline: Tue/Thu Post mornings, Wed Email afternoon
    const tue = nextDow(2, 10);
    list.push({
      label: "Weekly Post",
      when: toDateString(tue),
      channel: "Post",
      scheduledAt: tue.getTime(),
      reasoning: "Tuesday mornings are optimal for professional audiences",
    }); // Tue 10:00
    const wed = nextDow(3, 14);
    list.push({
      label: "Newsletter",
      when: toDateString(wed),
      channel: "Email",
      scheduledAt: wed.getTime(),
      reasoning: "Wednesday afternoons have highest email open rates",
    }); // Wed 14:00
    const thu = nextDow(4, 10);
    list.push({
      label: "Follow-up Post",
      when: toDateString(thu),
      channel: "Post",
      scheduledAt: thu.getTime(),
      reasoning: "Thursday mornings maintain engagement momentum",
    }); // Thu 10:00
    if (cadence === "aggressive") {
      // Add more touchpoints for momentum
      const mon = nextDow(1, 9);
      list.push({
        label: "Momentum Post",
        when: toDateString(mon),
        channel: "Post",
        scheduledAt: mon.getTime(),
        reasoning: "Monday mornings capture fresh week energy",
      }); // Mon 09:00
      const sat = nextDow(6, 11);
      list.push({
        label: "Weekend Teaser",
        when: toDateString(sat),
        channel: "Post",
        scheduledAt: sat.getTime(),
        reasoning: "Saturday late mornings reach leisure browsing audiences",
      }); // Sat 11:00
      const fri = nextDow(5, 15);
      list.push({
        label: "Promo Email",
        when: toDateString(fri),
        channel: "Email",
        scheduledAt: fri.getTime(),
        reasoning: "Friday afternoons are ideal for promotional content",
      }); // Fri 15:00
    } else if (cadence === "light") {
      // Keep it minimal: just ensure one post and an email
      return [
        {
          label: "Single Post",
          when: toDateString(nextDow(3, 10)),
          channel: "Post",
          scheduledAt: nextDow(3, 10).getTime(),
          reasoning: "Mid-week posting for consistent presence",
        }, // Wed 10:00
        {
          label: "Light Newsletter",
          when: toDateString(nextDow(4, 14)),
          channel: "Email",
          scheduledAt: nextDow(4, 14).getTime(),
          reasoning: "Weekly email to maintain subscriber engagement",
        }, // Thu 14:00
      ];
    }
    return list;
  }, [agentProfile?.cadence, aiSuggestions]);

  const filteredSuggested = React.useMemo(() => {
    if (channelFilter === "All") return suggestedSlots;
    return suggestedSlots.filter((s) => s.channel === channelFilter);
  }, [suggestedSlots, channelFilter]);

  const handleAddAllShown = async () => {
    if (isGuest) {
      toast("Sign in to add schedule slots.");
      onUpgrade?.();
      return;
    }
    try {
      for (const s of filteredSuggested) {
        await handleAddSlot(s);
      }
      toast.success(`Added ${filteredSuggested.length} slots`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add all slots");
    }
  };

  // Schedule slots persistence
  const listSlots =
    !isGuest && business?._id
      ? (useQuery as any)(api.schedule.listSlots, { businessId: business?._id })
      : [];
  const deleteSlot = useMutation(api.schedule.deleteSlot as any);

  // Handler to accept a suggested slot
  const handleAddSlot = async (slot: {
    label: string;
    channel: "Post" | "Email";
    when: string;
  }) => {
    try {
      // Log a small win locally (+3m) and server-side if signed in
      utils.recordLocalWin(3, "schedule_slot_added", {
        channel: slot.channel,
        when: slot.when,
      });
      if (business?._id) {
        // Persist to backend
        const whenDate = new Date();
        // attempt to parse "when" string using current locale best-effort; fallback to now
        // Consumers will typically set absolute times in the server; this provides a client-side shim
        try {
          const parsed = new Date(slot.when);
          if (!isNaN(parsed.getTime())) {
            whenDate.setTime(parsed.getTime());
          }
        } catch {}
        await addSlot({
          businessId: business?._id,
          label: slot.label,
          channel: (slot.channel === "Email" ? "email" : "post") as any,
          scheduledAt: whenDate.getTime(),
        } as any);
      }
      toast.success(`Added ${slot.channel} slot for ${slot.when}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add slot");
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deleteSlot({ slotId } as any);
      toast("Deleted slot");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete slot");
    }
  };

  // Next Best Action: pick a single dynamic CTA
  const nextBest = React.useMemo(() => {
    // Prefer turning most recent idea into workflow
    if (brainDumps && brainDumps.length > 0) {
      const topIdea = brainDumps[0];
      return {
        label: `Turn idea into workflow: ${topIdea.title || topIdea.content.slice(0, 40)}`,
        onClick: () => handleCreateWorkflowFromIdea(topIdea.content),
        reason: "Recent idea detected",
      };
    }
    // If churn risk flagged, nudge newsletter
    if (quickAnalytics?.churnAlert) {
      return {
        label: "Draft a retention newsletter",
        onClick: () => navigate("/workflows"),
        reason: "Churn risk detected",
      };
    }
    // Otherwise, most-used template
    if (orderedTemplates.length > 0) {
      const t = orderedTemplates[0];
      return {
        label: `Use template: ${t.name}`,
        onClick: () => handleUseTemplateEnhanced(t),
        reason: "Based on your usage",
      };
    }
    // Default
    return {
      label: "Create a simple workflow",
      onClick: () => navigate("/workflows"),
      reason: "Kickstart momentum",
    };
  }, [brainDumps, orderedTemplates]);

  // Quick‑add Brain Dump handler
  const handleQuickAddIdea = async () => {
    if (isGuest) {
      toast("Sign in to save ideas.");
      onUpgrade?.();
      return;
    }
    if (!currentInitiative?._id) {
      toast("No initiative found. Run setup first.");
      return;
    }
    const content = quickIdea.trim();
    if (!content) {
      toast("Type an idea first.");
      return;
    }
    try {
      setSavingQuickIdea(true);
      await addDumpTop({ initiativeId: currentInitiative?._id, content });
      setQuickIdea("");
      toast.success("Saved idea.");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save idea.");
    } finally {
      setSavingQuickIdea(false);
    }
  };

  // Enhance existing "Use Template" click:
  const handleUseTemplateEnhanced = async (tpl: {
    key: string;
    name: string;
  }) => {
    try {
      utils.bumpTemplateUsage(tpl.key);
      utils.recordLocalWin(5, "template_used", {
        templateKey: tpl.key,
        tone: agentProfile?.tone,
        persona: agentProfile?.persona,
      });
      if (business?._id) {
        await logWin({
          businessId: business?._id,
          winType: "template_used",
          timeSavedMinutes: 5,
          details: {
            templateKey: tpl.key,
            tone: agentProfile?.tone,
            persona: agentProfile?.persona,
          },
        });
      }
    } catch {}
    toast("Template adapted to your tone/persona");
    handleUseTemplate({ name: tpl.name });
  };

  // "Today's Focus (3)" suggestions (light heuristic)
  const todaysFocus = React.useMemo(() => {
    const suggestions: { title: string; action: () => void }[] = [];
    // 1) Recent idea
    if (brainDumps && brainDumps.length > 0) {
      const topIdea = brainDumps[0];
      suggestions.push({
        title: `Turn idea into workflow: ${topIdea.title || topIdea.content.slice(0, 40)}`,
        action: () => handleCreateWorkflowFromIdea(topIdea.content),
      });
    }
    // 2) Most-used template
    if (orderedTemplates.length > 0) {
      const t = orderedTemplates[0];
      suggestions.push({
        title: `Use template: ${t.name}`,
        action: () => handleUseTemplateEnhanced(t),
      });
    }
    // 3) Quick email draft as a default nudge (if you have a composer route, otherwise leave as placeholder)
    suggestions.push({
      title: "Draft this week's newsletter",
      action: () => navigate("/workflows"),
    });

    return suggestions.slice(0, 3);
  }, [brainDumps, orderedTemplates]);

  // Add: derive filtered templates for gallery
  const filteredTemplates = React.useMemo(() => {
    const q = galleryQuery.toLowerCase().trim();
    const base = orderedTemplates;
    if (!q) return base;
    return base.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tag.toLowerCase().includes(q),
    );
  }, [galleryQuery, orderedTemplates]);

  // Tag ideas by theme (simple keyword heuristic)
  const tagIdea = (text: string): Array<"content" | "offer" | "ops"> => {
    const t = text.toLowerCase();
    const out: Array<"content" | "offer" | "ops"> = [];
    if (/(post|tweet|blog|write|publish|newsletter|content)/.test(t))
      out.push("content");
    if (/(discount|offer|promo|sale|bundle|pricing|cta)/.test(t))
      out.push("offer");
    if (
      /(ops|process|system|template|automation|schedule|cadence|tooling)/.test(
        t,
      )
    )
      out.push("ops");
    return Array.from(new Set(out));
  };

  // Adapt short copy to tone + persona
  const adaptCopy = (base: string) => {
    const { tone, persona } = agentProfile || {
      tone: "friendly",
      persona: "maker",
      cadence: "standard",
    };
    let prefix = "";
    if (tone === "concise") prefix += "";
    if (tone === "friendly") prefix += "Hey there! ";
    if (tone === "premium") prefix += "Introducing our refined update: ";

    let personaHint = "";
    if (persona === "maker") personaHint = " Built for momentum.";
    if (persona === "coach") personaHint = " Actionable and supportive.";
    if (persona === "executive") personaHint = " Clear ROI and next steps.";

    return `${prefix}${base}${personaHint}`;
  };

  // Content Capsule generator (1 weekly post + 1 email + 3 tweets)
  const genContentCapsule = () => {
    const rev = fmtNum(quickAnalytics?.revenue90d ?? 0);
    const churn = quickAnalytics?.churnAlert
      ? "Churn risk spotted — re‑engage now."
      : "Healthy retention — keep cadence.";
    const top =
      (quickAnalytics?.topProducts ?? [])[0]?.name || "your top offer";
    const cadenceCopy =
      agentProfile?.cadence === "light"
        ? "light weekly"
        : agentProfile?.cadence === "aggressive"
          ? "high‑tempo"
          : "steady weekly";
    const weeklyPost = adaptCopy(
      `Weekly update: momentum check, ${cadenceCopy} plan, and a quick spotlight on ${top}. ${churn}`,
    );
    const emailSubject = adaptCopy(`This week's quick win: ${top}`);
    const emailBody = adaptCopy(
      `Here's your ${cadenceCopy} nudge. Highlight: ${top}. Rolling 90‑day revenue at $${rev}. ` +
        (quickAnalytics?.churnAlert
          ? "Let's re‑activate quiet subscribers with a friendly value note."
          : "Stay consistent and keep delivering value."),
    );
    const tweets: string[] = [
      adaptCopy(
        `Ship > perfect. This week: feature ${top} and keep your streak alive.`,
      ),
      adaptCopy(
        `Consistency compounds. One quick post today = momentum for the week.`,
      ),
      adaptCopy(`Tiny wins add up. Spotlight ${top} in under 90 words.`),
    ];
    return { weeklyPost, emailSubject, emailBody, tweets };
  };

  // Backend AI-powered capsule generation
  const generateCapsuleAI = useAction(api.solopreneur.generateContentCapsule);
  const [generatingCapsule, setGeneratingCapsule] = React.useState(false);

  // UI state: Content Capsule
  const [capsuleOpen, setCapsuleOpen] = React.useState(false);
  const [capsule, setCapsule] = React.useState<{
    weeklyPost: string;
    emailSubject: string;
    emailBody: string;
    tweets: string[];
  } | null>(null);
  const [editMode, setEditMode] = React.useState(false);

  const handleOpenCapsule = async () => {
    if (!business?._id) {
      toast.error("Please sign in to generate content");
      return;
    }

    setGeneratingCapsule(true);
    setCapsuleOpen(true);

    try {
      const result = await generateCapsuleAI({
        businessId: business?._id,
        agentProfile: agentProfile
          ? {
              tone: agentProfile.tone,
              persona: agentProfile.persona,
              cadence: agentProfile.cadence,
            }
          : undefined,
        analyticsContext: quickAnalytics
          ? {
              revenue90d: quickAnalytics.revenue90d,
              churnAlert: quickAnalytics.churnAlert,
              topProducts: quickAnalytics.topProducts,
            }
          : undefined,
      });

      if (result.success) {
        setCapsule(result.capsule);
        if (result.fallback) {
          toast.info("Using template-based generation (AI unavailable)");
        } else {
          toast.success("AI-powered content generated!");
        }
      } else {
        throw new Error("Generation failed");
      }
    } catch (error) {
      toast.error("Failed to generate content. Using fallback.");
      // Fallback to client-side generation
      const c = genContentCapsule();
      setCapsule(c);
    } finally {
      setGeneratingCapsule(false);
    }
  };

  const handleCopy = (txt: string, toastMsg = "Copied") => {
    navigator.clipboard.writeText(txt).then(
      () => toast.success(toastMsg),
      () => toast.error("Copy failed"),
    );
  };

  const handleSaveCapsuleWins = async () => {
    utils.recordLocalWin(12, "content_capsule_generated", {
      cadence: agentProfile?.cadence,
    });
    if (business?._id) {
      try {
        await logWin({
          businessId: business?._id,
          winType: "content_capsule_generated",
          timeSavedMinutes: 12,
          details: { cadence: agentProfile?.cadence },
        });
      } catch {}
    }
    toast("Saved win");
  };

  // Add Voice Notes (beta): record → transcribe (Web Speech API if available) → summarize & tag → save
  const [isRecording, setIsRecording] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [detectedTags, setDetectedTags] = React.useState<
    Array<"content" | "offer" | "ops">
  >([]);
  const recognitionRef = React.useRef<any>(null);

  // Start voice capture via Web Speech API if available, else guide user
  const startVoice = async () => {
    try {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition ||
        null;
      if (!SpeechRecognition) {
        toast("Voice recognition not supported in this browser");
        return;
      }
      const rec = new SpeechRecognition();
      rec.lang = "en-US";
      rec.continuous = false;
      rec.interimResults = true;
      rec.onresult = (e: any) => {
        let text = "";
        for (let i = 0; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
        }
        setTranscript(text);
      };
      rec.onend = () => {
        setIsRecording(false);
        // Simple auto-summarize: take first sentence or 20 words
        const clean = transcript.trim();
        const s =
          clean.split(/[.!?]/)[0] || clean.split(" ").slice(0, 20).join(" ");
        setSummary(s);
        setDetectedTags(tagIdea(clean));
      };
      recognitionRef.current = rec;
      setTranscript("");
      setSummary("");
      setDetectedTags([]);
      setIsRecording(true);
      rec.start();
    } catch (e: any) {
      setIsRecording(false);
      toast.error(e?.message ?? "Failed to start recording");
    }
  };

  const stopVoice = () => {
    try {
      const rec = recognitionRef.current;
      if (rec) rec.stop();
    } catch {}
  };

  // Save from voice summary into Brain Dump (delegated to BrainDumpSection-local handler)
  const handleSaveVoiceIdea = async () => {
    toast("Open the Brain Dump to save the voice note.");
  };

  // Business context for composer and SLA
  const currentBusiness = useQuery(
    api.businesses.currentUserBusiness as any,
    isAuthed ? {} : "skip",
  ) as any;
  const businessId = currentBusiness?._id;

  // SLA summary (skip if no business yet)
  const sla = useQuery(
    api.approvals.getSlaSummary as any,
    businessId ? { businessId } : "skip",
  ) as { total: number; overdue: number; dueSoon: number } | undefined;

  // Seed demo data
  const seedForMe = useAction(api.seed.seedForCurrentUser);

  // Local UI
  const [composerOpen, setComposerOpen] = React.useState(false);

  // Add: simple preflight checks for the composer
  const preflightWarnings: string[] = [];
  if (!businessId)
    preflightWarnings.push("No business configured — finish onboarding.");
  const defaultReplyTo = `noreply@${typeof window !== "undefined" ? window.location.hostname : "example.com"}`;

  // Inject default schedule time into existing CampaignComposer usage, if present
  const nextEmailSlot = useQuery(
    api.schedule.nextSlotByChannel,
    // Guarded usage: only query when businessId is available; otherwise, skip
    businessId
      ? { channel: "email", businessId, from: Date.now() }
      : ("skip" as any),
  );

  const winsSummary = useQuery(
    api.audit.winsSummary,
    businessId ? { businessId } : ("skip" as any),
  );

  const recentAudit = useQuery(
    api.audit.listForBusiness,
    businessId ? { businessId, limit: 3 } : ("skip" as any),
  );

  // Local fallback for wins when unauthenticated or no business
  function getLocalWinsFallback() {
    try {
      const raw = localStorage.getItem("pikar_local_wins_v1");
      if (!raw) return { wins: 0, totalTimeSavedMinutes: 0 };
      const arr = JSON.parse(raw) as Array<{
        at: number;
        timeSavedMinutes?: number;
      }>;
      let wins = 0;
      let totalTimeSavedMinutes = 0;
      const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
      for (const w of arr) {
        if (w.at >= since) {
          wins += 1;
          totalTimeSavedMinutes += Number(w.timeSavedMinutes || 0);
        }
      }
      return { wins, totalTimeSavedMinutes };
    } catch {
      return { wins: 0, totalTimeSavedMinutes: 0 };
    }
  }

  // Enhance existing "Send Newsletter" trigger to use handleOpenComposerPrefilled
  function handleOpenComposerPrefilled() {
    if (nextEmailSlot && nextEmailSlot.scheduledAt) {
      toast("Prefilling schedule with your next Email slot");
    }
    setComposerOpen(true);
  }

  // Optional: Add a small helper button for "Post" placeholder if you have a "Schedule Assistant" area
  function handlePostPlaceholder() {
    if (nextEmailSlot && nextEmailSlot.scheduledAt) {
      toast(
        `Post placeholder queued for ${new Date(nextEmailSlot.scheduledAt).toLocaleString()}`,
      );
    } else {
      toast("No upcoming slot found; add one in Schedule Assistant");
    }
  }

  // 2) Expose a "Post" quick action using next scheduled Post slot
  // Fetch next Post slot similar to nextEmailSlot (guarded by businessId):
  const nextPostSlot = useQuery(
    api.schedule.nextSlotByChannel,
    businessId
      ? { channel: "post", businessId, from: Date.now() }
      : ("skip" as any),
  );
  
  // Query for next scheduled social post
  const nextSocialPost = useQuery(
    api.socialPosts.getUpcomingPosts,
    businessId ? { businessId, limit: 1 } : ("skip" as any),
  );
  
  // Query for social analytics (last 30 days of posts)
  const socialAnalytics = useQuery(
    api.socialPosts.listScheduledPosts,
    businessId ? { businessId, limit: 100 } : ("skip" as any),
  );
  
  // Add: per-batch basic cap to avoid runaway adds; server can enforce stricter limits
  const BATCH_ADD_CAP = 10;

  // Add: handler to add all currently shown suggestions with cap + undo support
  const handleAddAllShownSlots = async () => {
    try {
      if (!suggestedSlots || suggestedSlots.length === 0) {
        toast.error("No suggested slots to add.");
        return;
      }

      if (!business?._id) {
        toast.error("No workspace selected.");
        return;
      }

      setAddingAll(true);

      // Determine remaining headroom if we have current slots
      const currentCount = Array.isArray(scheduleSlots)
        ? scheduleSlots.length
        : 0;
      const allowed = Math.max(0, BATCH_ADD_CAP - 0); // local cap for this batch
      let toAdd = suggestedSlots.slice(
        0,
        Math.min(allowed || BATCH_ADD_CAP, suggestedSlots.length),
      );

      // If there are tier caps elsewhere, this still limits batch size. Server entitlements can enforce strict limits.

      const createdIds: Array<string> = [];
      for (const s of toAdd) {
        // Assume suggestion object has channel, label, scheduledAt
        const res = await addSlot({
          businessId: business?._id,
          channel: s.channel,
          label: s.label ?? `${s.channel} slot`,
          scheduledAt: s.scheduledAt,
        } as any);
        if (res?._id) createdIds.push(res._id);
      }

      setLastBatchSlotIds(createdIds);

      toast.success(
        `Added ${createdIds.length} schedule slot${createdIds.length === 1 ? "" : "s"}.`,
        {
          action: {
            label: "Undo",
            onClick: async () => {
              try {
                for (const id of createdIds) {
                  await deleteSlot({ slotId: id as any });
                }
                toast("Undo complete.");
                setLastBatchSlotIds([]);
              } catch (e: any) {
                toast.error(e?.message ?? "Failed to undo.");
              }
            },
          },
        },
      );
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to add schedule slots.");
    } finally {
      setAddingAll(false);
    }
  };

  // Replace any existing upgradeNudges declaration with a guarded version
  const upgradeNudges = useQuery(
    api.telemetry.getUpgradeNudges,
    isGuest || !business?._id ? undefined : { businessId: business?._id }
  );

  // Add near other hooks/state inside component:
  const solTier = "solopreneur";
  const solFlags = useQuery(api.featureFlags.getFeatureFlags, {});
  const solAgents = useQuery(api.aiAgents.listRecommendedByTier, { tier: solTier, limit: 3 });
  const solAgentsEnabled = !!solFlags?.find(f => f.flagName === "solopreneur_quick_actions")?.isEnabled;
  const nav = useNavigate();

  // Add invoice state
  const [showInvoiceComposer, setShowInvoiceComposer] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [socialContent, setSocialContent] = useState("");
  const [socialPlatforms, setSocialPlatforms] = useState<string[]>([]);
  const [generatingSocial, setGeneratingSocial] = useState(false);

  // Add: One-Click Setup for Invoices
  const handleOneClickInvoice = async () => {
    try {
      // First create a demo invoice
      const demoInvoiceId = await createInvoice({
        businessId: business?._id,
        invoiceNumber: `INV-${Date.now()}`,
        clientName: "Demo Client",
        clientEmail: "demo@example.com",
        items: [
          {
            description: "Consulting Services",
            quantity: 1,
            unitPrice: 1000,
            amount: 1000,
          },
        ],
        subtotal: 1000,
        taxRate: 10,
        taxAmount: 100,
        total: 1100,
        currency: "USD",
        issueDate: Date.now(),
        dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
      });

      // Generate PDF
      const result = await generateInvoicePdf({ invoiceId: demoInvoiceId });
      
      toast.success("Invoice generated successfully!", {
        description: "Your demo invoice is ready to download.",
      });

      // Log win
      await logWin({
        businessId: business?._id,
        winType: "invoice_generated",
        timeSavedMinutes: 15,
      });
    } catch (error) {
      toast.error("Failed to generate invoice");
    }
  };

  // Add state for showing the calendar
  const [showCalendar, setShowCalendar] = useState(false);

  // Add: state for showing the setup wizard
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  return (
    <div className="space-y-6 p-6">
      {/* Quick actions: Send Newsletter */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="default"
          onClick={handleOpenComposerPrefilled}
          disabled={!businessId}
        >
          Send Newsletter
        </Button>
      </div>

      {/* Social Media AI Content Generator Modal */}
      <Dialog open={showSocialModal} onOpenChange={setShowSocialModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Social Content Generator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Topic or Idea
              </label>
              <Textarea
                placeholder="Enter a topic, idea, or paste blog content to repurpose..."
                value={socialContent}
                onChange={(e) => setSocialContent(e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Target Platforms
              </label>
              <div className="flex gap-2">
                {["twitter", "linkedin", "facebook"].map((platform) => (
                  <Button
                    key={platform}
                    size="sm"
                    variant={socialPlatforms.includes(platform) ? "default" : "outline"}
                    onClick={() => {
                      setSocialPlatforms((prev) =>
                        prev.includes(platform)
                          ? prev.filter((p) => p !== platform)
                          : [...prev, platform]
                      );
                    }}
                  >
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {nextSocialPost && nextSocialPost.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium mb-1">Next Scheduled Post</div>
                <div className="text-xs text-muted-foreground">
                  {nextSocialPost[0].scheduledAt && 
                    new Date(nextSocialPost[0].scheduledAt).toLocaleString()}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleGenerateSocialContent}
                disabled={generatingSocial || !socialContent.trim()}
              >
                {generatingSocial ? "Generating..." : "Generate Content"}
              </Button>
              <Button
                variant="outline"
                onClick={handleRepurposeBlogToSocial}
                disabled={generatingSocial}
              >
                Repurpose Blog
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowSocialModal(false);
                  setSocialContent("");
                  setSocialPlatforms([]);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Newsletter Composer Modal */}
      <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Quick Newsletter</DialogTitle>
          </DialogHeader>
          {preflightWarnings.length > 0 && (
            <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-2 text-amber-800">
              <div className="text-sm font-medium">Compliance preflight</div>
              <ul className="list-disc pl-5 text-xs">
                {preflightWarnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          {businessId ? (
            <CampaignComposerAny
              businessId={businessId}
              agentTone={agentProfile?.tone}
              agentPersona={agentProfile?.persona}
              agentCadence={agentProfile?.cadence}
              onClose={() => setComposerOpen(false)}
              onCreated={() => toast.success("Newsletter scheduled")}
              defaultScheduledAt={
                nextEmailSlot ? nextEmailSlot.scheduledAt : undefined
              }
              // Provide a default reply-to suggestion; ignored if component doesn't support it
              defaultReplyTo={defaultReplyTo}
            />
          ) : (
            <div className="text-sm text-muted-foreground">
              Finish onboarding to create a business first.
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Header / Nudge */}
      <div className="rounded-md border p-3 bg-emerald-50 flex items-center gap-3">
        <Badge
          variant="outline"
          className="border-emerald-300 text-emerald-700"
        >
          Solopreneur
        </Badge>
        <div className="text-sm">
          Supercharge your solo biz with focused tasks, quick actions, and clear
          KPIs.
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* New One-Click Setup button */}
          <Button
            size="sm"
            onClick={handleOneClickSetup}
            disabled={settingUp}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {settingUp ? "Setting up..." : "One‑Click Setup"}
          </Button>
          <Button size="sm" variant="outline" onClick={onUpgrade}>
            Upgrade to Startup
          </Button>
        </div>
      </div>

      {/* Next Best Action bar */}
      <div className="rounded-md border p-3 bg-emerald-50/60 flex items-center gap-3">
        <span className="text-sm font-medium">Next best action:</span>
        <Button
          size="sm"
          className="bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={nextBest.onClick}
        >
          {nextBest.label}
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">
          Reason: {nextBest.reason}
        </span>
        {/* Week 4: Schedule Assistant entry */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setScheduleOpen(true)}
        >
          Schedule Assistant
        </Button>
      </div>

      {/* Recommended Agents — Quick Actions (flag gated) */}
      {solAgentsEnabled && Array.isArray(solAgents) && solAgents.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {solAgents.map(a => (
            <Button
              key={a.agent_key}
              variant="secondary"
              className="justify-start"
              onClick={() => nav(`/agents?agent=${encodeURIComponent(a.agent_key)}`)}
              title={a.short_desc}
            >
              {a.display_name}
            </Button>
          ))}
        </div>
      )}

      {/* Template Gallery defaults — small chip strip */}
      {Array.isArray(solAgents) && solAgents.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {solAgents.map(a => (
            <Button
              key={`tg-${a.agent_key}`}
              size="sm"
              variant="outline"
              onClick={() => nav(`/agents?agent=${encodeURIComponent(a.agent_key)}`)}
            >
              Use with {a.display_name}
            </Button>
          ))}
        </div>
      )}

      {/* Agent Insights — concise card */}
      {Array.isArray(solAgents) && solAgents[0] && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>My Agent Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {solAgents[0].short_desc}
            </div>
            <div>
              <Button onClick={() => nav(`/agents?agent=${encodeURIComponent(solAgents[0].agent_key)}`)}>
                Open {solAgents[0].display_name}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Profile v2 (local) */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Agent Profile</h2>
        <Card>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Brand Tone
              </div>
              <div className="flex gap-2 flex-wrap">
                {(["concise", "friendly", "premium"] as const).map((t) => (
                  <Button
                    key={t}
                    size="sm"
                    variant={agentProfile?.tone === t ? "default" : "outline"}
                    className={
                      agentProfile?.tone === t
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : ""
                    }
                    onClick={() => saveAgentProfile({ tone: t })}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Audience Persona
              </div>
              <div className="flex gap-2 flex-wrap">
                {(["maker", "coach", "executive"] as const).map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={
                      agentProfile?.persona === p ? "default" : "outline"
                    }
                    className={
                      agentProfile?.persona === p
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : ""
                    }
                    onClick={() => saveAgentProfile({ persona: p })}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Preferred Cadence
              </div>
              <div className="flex gap-2 flex-wrap">
                {(["light", "standard", "aggressive"] as const).map((c) => (
                  <Button
                    key={c}
                    size="sm"
                    variant={
                      agentProfile?.cadence === c ? "default" : "outline"
                    }
                    className={
                      agentProfile?.cadence === c
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : ""
                    }
                    onClick={() => saveAgentProfile({ cadence: c })}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Persistent Quick Bar */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setGalleryOpen(true)}
          >
            New Idea
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/workflows")}
          >
            Draft Email
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleQuickAction("Create Post")}
          >
            Create Post
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={handleOpenCapsule}
          >
            Content Capsule
          </Button>
        </div>
      </section>

      {/* Content Capsule Dialog */}
      <Dialog open={capsuleOpen} onOpenChange={setCapsuleOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Content Capsule</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {generatingCapsule
                ? "Generating AI-powered content..."
                : "One weekly post, one email, and 3 tweet variants adapted to your tone/persona."}
            </p>
            {generatingCapsule && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            )}
            {capsule && !generatingCapsule && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditMode(!editMode)}
                  >
                    {editMode ? "View Mode" : "Edit Mode"}
                  </Button>
                </div>

                <Card>
                  <CardContent className="p-3 space-y-2">
                    <div className="text-xs text-muted-foreground">
                      Weekly Post
                    </div>
                    {editMode ? (
                      <textarea
                        className="w-full min-h-[100px] p-2 text-sm border rounded"
                        value={capsule.weeklyPost}
                        onChange={(e) =>
                          setCapsule({ ...capsule, weeklyPost: e.target.value })
                        }
                      />
                    ) : (
                      <div className="text-sm whitespace-pre-wrap">
                        {capsule.weeklyPost}
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleCopy(capsule.weeklyPost, "Copied weekly post")
                      }
                    >
                      Copy
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3 space-y-2">
                    <div className="text-xs text-muted-foreground">Email</div>
                    {editMode ? (
                      <>
                        <input
                          className="w-full p-2 text-sm border rounded font-medium"
                          placeholder="Subject"
                          value={capsule.emailSubject}
                          onChange={(e) =>
                            setCapsule({
                              ...capsule,
                              emailSubject: e.target.value,
                            })
                          }
                        />
                        <textarea
                          className="w-full min-h-[120px] p-2 text-sm border rounded"
                          value={capsule.emailBody}
                          onChange={(e) =>
                            setCapsule({ ...capsule, emailBody: e.target.value })
                          }
                        />
                      </>
                    ) : (
                      <>
                        <div className="text-sm font-medium">
                          Subject: {capsule.emailSubject}
                        </div>
                        <div className="text-sm whitespace-pre-wrap">
                          {capsule.emailBody}
                        </div>
                      </>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleCopy(capsule.emailSubject, "Copied subject")
                        }
                      >
                        Copy Subject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleCopy(capsule.emailBody, "Copied email body")
                        }
                      >
                        Copy Body
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3 space-y-2">
                    <div className="text-xs text-muted-foreground">
                      Tweet Variants
                    </div>
                    <div className="space-y-2">
                      {capsule.tweets.map((t, i) => (
                        <div
                          key={i}
                          className="flex items-start justify-between gap-2 border rounded p-2"
                        >
                          {editMode ? (
                            <textarea
                              className="flex-1 min-h-[60px] p-1 text-sm border rounded"
                              value={t}
                              onChange={(e) => {
                                const newTweets = [...capsule.tweets];
                                newTweets[i] = e.target.value;
                                setCapsule({ ...capsule, tweets: newTweets });
                              }}
                            />
                          ) : (
                            <div className="text-sm whitespace-pre-wrap flex-1">
                              {t}
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopy(t, "Copied tweet")}
                          >
                            Copy
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleSaveCapsuleWins}>
              Save Win
            </Button>
            <Button onClick={() => setCapsuleOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* My Templates strip */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">My Templates</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setGalleryOpen(true)}
          >
            Open Gallery
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {orderedTemplatesWithPins.map((t) => (
            <Card key={t.key} className="...">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{t.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {t.tag}
                    </Badge>
                    <Button
                      size="icon"
                      variant={pinnedSet.has(t.key) ? "default" : "outline"}
                      className={
                        pinnedSet.has(t.key)
                          ? "bg-emerald-600 text-white hover:bg-emerald-700 h-8 w-8"
                          : "h-8 w-8"
                      }
                      onClick={() =>
                        handlePinTemplate(t.key, !pinnedSet.has(t.key))
                      }
                      aria-label={
                        pinnedSet.has(t.key) ? "Unpin template" : "Pin template"
                      }
                      title={pinnedSet.has(t.key) ? "Unpin" : "Pin"}
                    >
                      {pinnedSet.has(t.key) ? "★" : "☆"}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{t.description}</p>
                <div className="pt-1">
                  <Button
                    size="sm"
                    onClick={() => handleUseTemplateEnhanced(t)}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Use
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Template Gallery Modal */}
        <TemplateGallery
          open={galleryOpen}
          onOpenChange={setGalleryOpen}
          templates={filteredTemplates}
          pinnedSet={pinnedSet}
          searchQuery={galleryQuery}
          onSearchChange={setGalleryQuery}
          onPinTemplate={handlePinTemplate}
          onUseTemplate={(t) => {
            handleUseTemplateEnhanced(t);
            setGalleryOpen(false);
          }}
        />
      </section>

      {/* Today's Focus (max 3) */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Today&apos;s Focus</h2>
        <Card className="mt-4">
          <CardHeader className="flex items-center justify-between gap-2 sm:flex-row">
            <CardTitle className="text-base sm:text-lg">
              Today's Focus
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Streak: {utils.streak}d</Badge>
              <Badge variant="outline">
                Time saved: {utils.timeSavedTotal}m
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {todaysFocus.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="text-sm">{s.title}</div>
                <Button size="sm" onClick={s.action}>
                  Do it
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
        {focusTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {focusTasks.map((t: any) => (
              <Card key={String(t.id ?? t.title)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium">
                        {String(t.title ?? "Task")}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Priority: {String(t.priority ?? "medium")}
                        {t?.dueDate ? ` • Due: ${t.dueDate}` : ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => alert("Nice! Task completed")}
                    >
                      Done
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-6 text-sm text-muted-foreground">
              No focus tasks yet. Add up to three high-impact tasks to stay on
              track.
            </CardContent>
          </Card>
        )}
        {/* Inline quick‑add Brain Dump */}
        {!isGuest && (
          <div className="mb-3 flex items-center gap-2">
            <Input
              placeholder="Quick add idea to Brain Dump..."
              value={quickIdea}
              onChange={(e) => setQuickIdea(e.target.value)}
            />
            <Button
              size="sm"
              onClick={handleQuickAddIdea}
              disabled={savingQuickIdea}
            >
              {savingQuickIdea ? "Saving..." : "Add"}
            </Button>
          </div>
        )}
      </section>

      {/* Quick Actions - now extracted */}
      <QuickActions
        businessId={businessId}
        isGuest={isGuest}
        onUpgrade={onUpgrade}
        nextPostSlot={nextPostSlot}
        nextSocialPost={nextSocialPost}
        socialAnalytics={socialAnalytics}
        onQuickPost={handleQuickPost}
        onOpenSchedule={() => setScheduleOpen(true)}
        onGenerateSocial={() => setShowSocialModal(true)}
        generatingSocial={generatingSocial}
        onRepurposeBlog={handleRepurposeBlogToSocial}
      />

      {/* Simple Social Analytics Widget (Last 7 Days) */}
      {socialAnalytics && socialAnalytics.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">Social Performance (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-emerald-600">
                  {socialAnalytics.filter((p: any) => {
                    const postDate = new Date(p.scheduledAt || 0);
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    return postDate >= sevenDaysAgo;
                  }).length}
                </div>
                <div className="text-xs text-muted-foreground">Posts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {socialAnalytics.reduce((acc: number, p: any) => 
                    acc + (p.platforms?.length || 0), 0
                  )}
                </div>
                <div className="text-xs text-muted-foreground">Platforms</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(socialAnalytics.length / 7 * 10) / 10}
                </div>
                <div className="text-xs text-muted-foreground">Avg/Day</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Support Triage (beta) */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Support Triage (beta)</h2>
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Paste an inbound email and get suggested replies. No external
              APIs, safe to try in guest mode.
            </p>
            <Textarea
              placeholder="Paste an email thread or message to triage..."
              value={emailBody}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setEmailBody(e.target.value)
              }
              className="min-h-28"
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleSuggestReplies}
                disabled={triageLoading}
              >
                {triageLoading ? "Generating..." : "Suggest Replies"}
              </Button>
              {!isGuest && (
                <span className="text-xs text-muted-foreground">
                  Suggestions are also lightly logged to audit when signed in.
                </span>
              )}
            </div>

            {triageSuggestions.length > 0 && (
              <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                {triageSuggestions.map((s: any, idx: number) => (
                  <Card key={`${s.label}-${idx}`}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{s.label}</span>
                        <Badge
                          variant={
                            s.priority === "high" ? "destructive" : "outline"
                          }
                          className="capitalize"
                        >
                          {s.priority}
                        </Badge>
                      </div>
                      <div className="text-sm whitespace-pre-wrap">
                        {s.reply}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(s.reply).then(
                              () => toast("Copied reply"),
                              () => toast.error("Copy failed"),
                            );
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Privacy Controls */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Privacy Controls</h2>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Clear uploaded files and reset your agent's document references.
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleForgetUploads}
              disabled={isGuest}
            >
              Forget uploads
            </Button>
          </CardContent>
        </Card>
      </section>

      <KpiSnapshot snapshot={snapshot} />

      {/* ROI Dashboard - replaces Micro-Analytics */}
      <div className="col-span-full">
        <RoiDashboard businessId={business?._id} userId={user?._id} />
      </div>

      {/* Add Invoice Widget */}
      <InvoiceWidget businessId={businessId} />

      {/* Add Content Calendar Widget */}
      <ContentCalendarWidget businessId={businessId} userId={user?._id || null} />

      <LazyLoadErrorBoundary moduleName="Email Campaign Analytics">
        <Suspense fallback={<div className="text-muted-foreground">Loading email analytics...</div>}>
          <EmailCampaignAnalytics />
        </Suspense>
      </LazyLoadErrorBoundary>

      <LazyLoadErrorBoundary moduleName="Content Capsule">
        <Suspense fallback={<div className="text-muted-foreground">Loading content capsule...</div>}>
          <ContentCapsule />
        </Suspense>
      </LazyLoadErrorBoundary>

      <LazyLoadErrorBoundary moduleName="Customer Segmentation">
        <Suspense fallback={<div className="text-muted-foreground">Loading customer segments...</div>}>
          <CustomerSegmentation />
        </Suspense>
      </LazyLoadErrorBoundary>

      <LazyLoadErrorBoundary moduleName="Social Performance">
        <Suspense fallback={<div className="text-muted-foreground">Loading social performance...</div>}>
          <SocialPerformance />
        </Suspense>
      </LazyLoadErrorBoundary>

      {/* Add Calendar Dialog */}
      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {business?._id && user?._id && (
            <ContentCalendar businessId={business?._id} userId={user?._id} />
          )}
        </DialogContent>
      </Dialog>

      {/* Content Capsule launcher */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Content Capsule</h2>
        <Button size="sm" onClick={handleOpenCapsule}>
          Generate
        </Button>
      </div>

      {/* Recent Activity */}
      <RecentActivity notifications={notifications} isGuest={isGuest} />

      {/* Brain Dump */}
      <BrainDumpSection businessId={business?._id} />

      {/* Help Coach */}
      <HelpCoach 
        visibleTips={visibleTips} 
        onDismissTip={(tipId) => setDismissedTips((d) => ({ ...d, [tipId]: true }))}
      />

      {/* Wins History */}
      <WinsHistory 
        wins={wins}
        streak={utils.streak}
        timeSavedTotal={utils.timeSavedTotal}
        onClearWins={utils.clearLocalWins}
      />

      {/* Add: Customer Segmentation widget */}
      <CustomerSegmentation businessId={businessId} />

      {isAuthed && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            onClick={async () => {
              try {
                if (
                  !window.confirm(
                    "Seed demo data for your account? This may create example records.",
                  )
                )
                  return;
                const res = await seedForMe({});
                toast.success("Demo data seeded");
                if ((res as any)?.businessId) {
                  // no-op; UI is reactive via Convex queries
                }
              } catch (e: any) {
                toast.error(e?.message ?? "Failed to seed demo data");
              }
            }}
          >
            Seed Demo Data
          </Button>
        </div>
      )}

      {/* Add Invoice Composer Modal */}
      {showInvoiceComposer && (
        <InvoiceComposer
          open={showInvoiceComposer}
          onOpenChange={setShowInvoiceComposer}
          businessId={business?._id}
        />
      )}

      {/* ROI Dashboard Section */}
      {!isGuest && business?._id && user?._id && (
        <section className="mb-6">
          <RoiDashboard 
            businessId={business?._id} 
            userId={user?._id}
          />
        </section>
      )}

      {/* Content Calendar Section */}
      {!isGuest && business?._id && user?._id && (
        <section className="mb-6">
          <ContentCalendar 
            businessId={business?._id} 
            userId={user?._id}
          />
        </section>
      )}

      {/* A/B Testing Upgrade Prompt */}
      {!isGuest && (
        <Card className="border-dashed border-2 border-amber-300 bg-amber-50/50 mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">🧪 A/B Testing Engine</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Test email variants, measure performance, and automatically determine winners with statistical significance.
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground mb-4">
                  <li>• Create experiments with 2-4 variants</li>
                  <li>• Track opens, clicks, and conversions</li>
                  <li>• Chi-square statistical analysis</li>
                  <li>• Auto-declare winners</li>
                </ul>
              </div>
              <Button onClick={onUpgrade} size="sm">
                Upgrade to Startup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CRM Integration Upgrade Prompt */}
      {!isGuest && (
        <Card className="border-dashed border-2 border-amber-300 bg-amber-50/50 mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">🔗 CRM Bidirectional Sync</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect Salesforce, HubSpot, or Pipedrive for seamless contact and deal synchronization.
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground mb-4">
                  <li>• Automatic contact sync</li>
                  <li>• Deal pipeline management</li>
                  <li>• Conflict resolution</li>
                  <li>• Real-time updates</li>
                </ul>
              </div>
              <Button onClick={onUpgrade} size="sm">
                Upgrade to Startup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Assistant Dialog - now extracted */}
      <ScheduleAssistant
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        businessId={business?._id}
        agentCadence={agentProfile?.cadence}
        isGuest={isGuest}
        onAddSlot={handleAddSlot}
      />

      {/* Setup Wizard Dialog */}
      {user?._id && businessId && (
        <SolopreneurSetupWizard
          open={showSetupWizard}
          onClose={() => setShowSetupWizard(false)}
          userId={user?._id}
          businessId={businessId}
        />
      )}
    </div>
  );
}

export default SolopreneurDashboard;