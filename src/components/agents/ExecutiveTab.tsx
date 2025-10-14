import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertCircle, 
  Brain, 
  Send, 
  Zap, 
  Calendar, 
  TrendingUp, 
  Copy, 
  BookOpen,
  Download,
  History,
  FileText,
  Clock
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";

export default function ExecutiveTab() {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{
    question: string;
    answer: string;
    timestamp: number;
    sources?: Array<{ documentId?: string; preview: string; score: number }>;
    contextUsed?: number;
  }>>([]);
  const [lastError, setLastError] = useState<{
    title: string;
    message: string;
    correlationId?: string;
  } | null>(null);

  // Rate limiting state
  const [lastAskTime, setLastAskTime] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const RATE_LIMIT_MS = 8000; // 8 seconds between requests

  // Transcript drawer state
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  const currentBiz = useQuery(api.businesses.currentUserBusiness, {});
  const execRouter = useAction(api.agentRouter.execRouter);
  const createWorkflowFromIdea = useMutation(api.workflows.createQuickFromIdea as any);
  const agentProfile = useQuery(
    api.aiAgents.getAgentProfile as any,
    currentBiz?._id && user?._id
      ? { businessId: currentBiz._id, userId: user._id as any }
      : undefined
  );
  const execEnabled = useQuery(api.featureFlags.solopreneurExecAssistantEnabled, undefined);

  // Gate entire Executive tab if the feature flag is explicitly disabled
  if (execEnabled === false) {
    return null;
  }

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("exec_chat_history");
    if (saved) {
      try {
        setChatHistory(JSON.parse(saved));
      } catch (e) {
        console.warn("Failed to load chat history:", e);
      }
    }
  }, []);

  // Save chat history to localStorage
  const saveHistory = (newHistory: typeof chatHistory) => {
    setChatHistory(newHistory);
    localStorage.setItem("exec_chat_history", JSON.stringify(newHistory));
  };

  // Rate limiting countdown effect
  useEffect(() => {
    if (lastAskTime === 0) return;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastAskTime;
      const remaining = Math.max(0, RATE_LIMIT_MS - elapsed);
      setCooldownRemaining(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [lastAskTime]);

  // Helper: transient error detector
  const isTransientError = (err: unknown): boolean => {
    const msg = (err as any)?.message?.toLowerCase?.() || "";
    return (
      msg.includes("failed to fetch") ||
      msg.includes("network") ||
      msg.includes("timeout") ||
      msg.includes("temporarily") ||
      msg.includes("try again") ||
      msg.includes("internal server")
    );
  };

  // Helper: retry with simple exponential backoff
  const withRetry = async <T,>(
    fn: () => Promise<T>,
    attempts: number = 3,
    baseDelayMs: number = 400
  ): Promise<T> => {
    let lastErr: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        if (!isTransientError(err) || i === attempts - 1) break;
        const wait = baseDelayMs * Math.pow(2, i);
        await new Promise((res) => setTimeout(res, wait));
      }
    }
    throw lastErr;
  };

  const handleAsk = async () => {
    if (!question.trim() || !currentBiz?._id || isAsking) return;

    // Check rate limit
    const now = Date.now();
    const timeSinceLastAsk = now - lastAskTime;
    if (timeSinceLastAsk < RATE_LIMIT_MS) {
      const remainingSeconds = Math.ceil((RATE_LIMIT_MS - timeSinceLastAsk) / 1000);
      toast.error(`Please wait ${remainingSeconds}s before asking again`);
      return;
    }

    setIsAsking(true);
    setLastAskTime(now);
    
    try {
      const response = await execRouter({
        mode: "summarizeIdeas",
        businessId: currentBiz._id,
        userId: user?._id,
        input: question
      });

      const newEntry = {
        question: question.trim(),
        answer: response.summary || "I've analyzed your recent ideas and context.",
        timestamp: Date.now(),
        contextUsed: response.contextUsed || 0,
      };

      const newHistory = [newEntry, ...chatHistory].slice(0, 20);
      saveHistory(newHistory);
      setQuestion("");
      
      setLastError(null);
      toast.success(`Response generated${response.contextUsed ? ` (used ${response.contextUsed} context sources)` : ""}`);
    } catch (error: any) {
      const msg = error?.message || "Failed to get response.";
      setLastError({
        title: "Assistant Error",
        message: msg,
      });
      toast.error(`Failed to get response: ${msg}`);
    } finally {
      setIsAsking(false);
    }
  };

  const handleQuickAction = async (mode: "proposeNextAction" | "planWeek" | "createCapsule") => {
    if (!currentBiz?._id) {
      toast("Please sign in and select a workspace to use quick actions.");
      return;
    }

    try {
      const run = () =>
        execRouter({
          mode,
          businessId: currentBiz._id,
          userId: user?._id,
        });

      const response = await withRetry(run, 3, 400);

      if (mode === "createCapsule") {
        const ok = !!(response as any)?.success;
        const correlationId = (response as any)?.correlationId;
        if (ok) {
          const saved =
            typeof (response as any)?.timeSaved === "number" ? (response as any).timeSaved : undefined;
          setLastError(null);
          toast.success(`Capsule created${saved ? `! Saved ${saved} minutes.` : "!"}`);
        } else {
          const message =
            (response as any)?.message ||
            (response as any)?.error ||
            "The capsule action didn't complete. Please review your setup and try again.";
          setLastError({
            title: "Playbook Execution Failed",
            message,
            correlationId,
          });
          toast.error(`${message}${correlationId ? ` (ref: ${correlationId})` : ""}`);
          console.error("Playbook execution error", { response });
        }
        return;
      }

      const newEntry = {
        question: `Quick action: ${mode}`,
        answer:
          (response as any).action ||
          (response as any).weeklyPlan ||
          "Action completed",
        timestamp: Date.now(),
        contextUsed: (response as any).contextUsed || 0,
      };

      const newHistory = [newEntry, ...chatHistory].slice(0, 20);
      saveHistory(newHistory);
      setLastError(null);
      toast.success(`Quick action completed${newEntry.contextUsed ? ` (used ${newEntry.contextUsed} context sources)` : ""}`);
    } catch (error: any) {
      const transient = isTransientError(error);
      const message =
        error?.message ||
        (transient
          ? "Network hiccup prevented this action. Please try again shortly."
          : "Action failed due to an unexpected error.");
      setLastError({
        title: "Playbook Error",
        message,
      });
      toast.error(message);
      console.error("Quick action error", error);
    }
  };

  const copyAnswer = (answer: string) => {
    navigator.clipboard.writeText(answer);
    toast.success("Answer copied to clipboard");
  };

  const handleUseAsWorkflow = async (entry: typeof chatHistory[0]) => {
    if (!currentBiz?._id) {
      toast.error("Please sign in to create workflows");
      return;
    }

    try {
      const ideaText = `${entry.question}\n\n${entry.answer}`;
      await createWorkflowFromIdea({
        businessId: currentBiz._id,
        ideaText,
        title: entry.question.slice(0, 80),
      });
      toast.success("Workflow created from conversation");
    } catch (error: any) {
      toast.error(error?.message || "Failed to create workflow");
    }
  };

  const exportTranscript = () => {
    try {
      const exportData = chatHistory.map(entry => ({
        timestamp: new Date(entry.timestamp).toISOString(),
        question: entry.question,
        answer: entry.answer,
        contextUsed: entry.contextUsed || 0,
      }));

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `executive-transcript-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Transcript exported successfully");
    } catch (error) {
      toast.error("Failed to export transcript");
    }
  };

  const clearHistory = () => {
    saveHistory([]);
    toast.success("Conversation history cleared");
  };

  const cooldownProgress = cooldownRemaining > 0 
    ? ((RATE_LIMIT_MS - cooldownRemaining) / RATE_LIMIT_MS) * 100 
    : 100;

  return (
    <div className="space-y-6">
      {/* Executive Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-emerald-600" />
            Executive Assistant Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Goals</label>
              <p className="text-sm">{agentProfile?.businessSummary || "Not set"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Brand Voice</label>
              <p className="text-sm">{agentProfile?.brandVoice || "Not set"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
              <p className="text-sm">
                {agentProfile?.lastUpdated 
                  ? new Date(agentProfile.lastUpdated).toLocaleDateString()
                  : "Never"
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Global Playbook/Assistant Error Banner */}
      {lastError && (
        <Alert variant="destructive" className="border-red-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 mt-0.5 text-red-600" />
            <div className="flex-1">
              <AlertTitle>{lastError.title}</AlertTitle>
              <AlertDescription>
                <div className="space-y-1">
                  <div>{lastError.message}</div>
                  {lastError.correlationId && (
                    <div className="text-xs text-muted-foreground">
                      Reference: <code>{lastError.correlationId}</code>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => setLastError(null)}
            >
              Dismiss
            </Button>
          </div>
        </Alert>
      )}

      {/* Ask My Executive */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ask My Executive</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTranscriptOpen(true)}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              Transcript ({chatHistory.length})
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask about your business, ideas, or next steps..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1"
              rows={2}
              disabled={isAsking || cooldownRemaining > 0}
            />
            <Button 
              onClick={handleAsk}
              disabled={!question.trim() || isAsking || cooldownRemaining > 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isAsking ? (
                <>Thinking...</>
              ) : cooldownRemaining > 0 ? (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {Math.ceil(cooldownRemaining / 1000)}s
                </div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Rate limit progress bar */}
          {cooldownRemaining > 0 && (
            <div className="space-y-1">
              <Progress value={cooldownProgress} className="h-1" />
              <p className="text-xs text-muted-foreground">
                Rate limit cooldown: {Math.ceil(cooldownRemaining / 1000)}s remaining
              </p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("proposeNextAction")}
              className="flex items-center gap-1"
              disabled={cooldownRemaining > 0}
            >
              <Zap className="h-3 w-3" />
              Next Best Action
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("planWeek")}
              className="flex items-center gap-1"
              disabled={cooldownRemaining > 0}
            >
              <Calendar className="h-3 w-3" />
              Plan Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("createCapsule")}
              className="flex items-center gap-1"
              disabled={cooldownRemaining > 0}
            >
              <TrendingUp className="h-3 w-3" />
              Create Capsule
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transcript Drawer */}
      <Sheet open={transcriptOpen} onOpenChange={setTranscriptOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Conversation Transcript
            </SheetTitle>
            <SheetDescription>
              Your complete conversation history with the Executive Assistant
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Export and Clear Actions */}
            <div className="flex items-center justify-between gap-2 pb-4 border-b">
              <div className="text-sm text-muted-foreground">
                {chatHistory.length} conversation{chatHistory.length !== 1 ? 's' : ''}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportTranscript}
                  disabled={chatHistory.length === 0}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={clearHistory}
                  disabled={chatHistory.length === 0}
                >
                  Clear All
                </Button>
              </div>
            </div>

            {/* Conversation History */}
            {chatHistory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm">Start by asking a question above</p>
              </div>
            ) : (
              <div className="space-y-6">
                {chatHistory.map((entry, index) => (
                  <div key={index} className="border-l-2 border-emerald-200 pl-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {new Date(entry.timestamp).toLocaleString()}
                      </Badge>
                      {entry.contextUsed !== undefined && entry.contextUsed > 0 && (
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {entry.contextUsed} context source{entry.contextUsed > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Question:</p>
                        <p className="text-sm bg-muted/50 p-3 rounded-md">{entry.question}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Answer:</p>
                        <p className="text-sm bg-white p-3 rounded-md border whitespace-pre-wrap">
                          {entry.answer}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyAnswer(entry.answer)}
                        className="flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUseAsWorkflow(entry)}
                        className="flex items-center gap-1"
                      >
                        <FileText className="h-3 w-3" />
                        Use as Workflow
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Recent Conversations Preview (kept for backward compatibility) */}
      {chatHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {chatHistory.slice(0, 3).map((entry, index) => (
                <div key={index} className="border-l-2 border-emerald-200 pl-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {new Date(entry.timestamp).toLocaleString()}
                    </Badge>
                    {entry.contextUsed !== undefined && entry.contextUsed > 0 && (
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {entry.contextUsed} context source{entry.contextUsed > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Q: {entry.question}</p>
                    <div className="flex items-start justify-between gap-2 mt-1">
                      <p className="text-sm">{entry.answer}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyAnswer(entry.answer)}
                        className="flex-shrink-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {chatHistory.length > 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTranscriptOpen(true)}
                  className="w-full"
                >
                  View all {chatHistory.length} conversations
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}