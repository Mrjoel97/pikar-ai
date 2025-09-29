import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Send, Zap, Calendar, TrendingUp, Copy } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function ExecutiveTab() {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{
    question: string;
    answer: string;
    timestamp: number;
  }>>([]);

  const currentBiz = useQuery(api.businesses.currentUserBusiness, {});
  const execRouter = useAction(api.agentRouter.execRouter);
  const agentProfile = useQuery(
    api.aiAgents.getAgentProfile,
    currentBiz?._id ? { businessId: currentBiz._id } : undefined
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

  // Helper: transient error detector
  const isTransientError = (err: unknown): boolean => {
    const msg = (err as any)?.message?.toLowerCase?.() || "";
    // Network hiccups, 5xx-like hints, and fetch failures
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
        const wait = baseDelayMs * Math.pow(2, i); // 400, 800, 1600
        await new Promise((res) => setTimeout(res, wait));
      }
    }
    throw lastErr;
  };

  const handleAsk = async () => {
    if (!question.trim() || !currentBiz?._id || isAsking) return;

    setIsAsking(true);
    try {
      // For general questions, use summarizeIdeas mode
      const response = await execRouter({
        mode: "summarizeIdeas",
        businessId: currentBiz._id,
        userId: user?._id,
        input: question
      });

      const newEntry = {
        question: question.trim(),
        answer: response.summary || "I've analyzed your recent ideas and context.",
        timestamp: Date.now()
      };

      const newHistory = [newEntry, ...chatHistory].slice(0, 20); // Keep last 20
      saveHistory(newHistory);
      setQuestion("");
      
      toast.success("Executive response generated");
    } catch (error: any) {
      toast.error(`Failed to get response: ${error.message}`);
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

      // Retry only for potentially transient failures; keep attempts small
      const response = await withRetry(run, 3, 400);

      if (mode === "createCapsule") {
        // Refined, user-friendly outcomes with correlationId surfaced if present
        const ok = !!(response as any)?.success;
        const correlationId = (response as any)?.correlationId;
        if (ok) {
          const saved =
            typeof (response as any)?.timeSaved === "number" ? (response as any).timeSaved : undefined;
          toast.success(`Capsule created${saved ? `! Saved ${saved} minutes.` : "!"}`);
        } else {
          const message =
            (response as any)?.message ||
            (response as any)?.error ||
            "The capsule action didn't complete. Please review your setup and try again.";
          toast.error(`${message}${correlationId ? ` (ref: ${correlationId})` : ""}`);
          console.error("Playbook execution error", { response }); // safe console detail
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
      };

      const newHistory = [newEntry, ...chatHistory].slice(0, 20);
      saveHistory(newHistory);
      toast.success("Quick action completed");
    } catch (error: any) {
      // Refined error messaging: differentiate transient vs non-transient
      const transient = isTransientError(error);
      const message =
        error?.message ||
        (transient
          ? "Network hiccup prevented this action. Please try again shortly."
          : "Action failed due to an unexpected error.");
      toast.error(message);
      console.error("Quick action error", error);
    }
  };

  const copyAnswer = (answer: string) => {
    navigator.clipboard.writeText(answer);
    toast.success("Answer copied to clipboard");
  };

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

      {/* Ask My Executive */}
      <Card>
        <CardHeader>
          <CardTitle>Ask My Executive</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask about your business, ideas, or next steps..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1"
              rows={2}
            />
            <Button 
              onClick={handleAsk}
              disabled={!question.trim() || isAsking}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("proposeNextAction")}
              className="flex items-center gap-1"
            >
              <Zap className="h-3 w-3" />
              Next Best Action
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("planWeek")}
              className="flex items-center gap-1"
            >
              <Calendar className="h-3 w-3" />
              Plan Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("createCapsule")}
              className="flex items-center gap-1"
            >
              <TrendingUp className="h-3 w-3" />
              Create Capsule
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chat History - refined empty state */}
      {chatHistory.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {chatHistory.map((entry, index) => (
                <div key={index} className="border-l-2 border-emerald-200 pl-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {new Date(entry.timestamp).toLocaleString()}
                    </Badge>
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
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-white p-4 text-sm text-muted-foreground">
              No conversations yet. Ask a question above or try a Quick Action like "Next Best Action" to get started.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}