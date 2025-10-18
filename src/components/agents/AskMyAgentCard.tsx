import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bot, History, Copy } from "lucide-react";

interface AskMyAgentCardProps {
  ask: string;
  setAsk: (value: string) => void;
  reply: string | null;
  asking: boolean;
  dryRun: boolean;
  setDryRun: (value: boolean) => void;
  lastAskAt: number;
  rateLimitMs: number;
  onAsk: () => void;
  onOpenHistory: () => void;
  onUseAsWorkflow: () => void;
  onScheduleNow: () => void;
  onCopyAnswer: () => void;
}

export function AskMyAgentCard({
  ask,
  setAsk,
  reply,
  asking,
  dryRun,
  setDryRun,
  lastAskAt,
  rateLimitMs,
  onAsk,
  onOpenHistory,
  onUseAsWorkflow,
  onScheduleNow,
  onCopyAnswer,
}: AskMyAgentCardProps) {
  const cooldownRemaining = Math.max(0, rateLimitMs - (Date.now() - lastAskAt));
  const isOnCooldown = cooldownRemaining > 0;

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-600" />
              Ask My Agent
            </CardTitle>
            <CardDescription>
              Get quick, actionable recommendations summarized by your agent using your context.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 border rounded-md px-3 py-1.5">
              <span className="text-sm">Dry Run</span>
              <Switch checked={dryRun} onCheckedChange={setDryRun} />
            </div>
            <Button variant="secondary" onClick={onOpenHistory}>
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            placeholder="e.g., Draft a retention campaign idea for this week"
            className="flex-1"
            disabled={asking}
          />
          <Button
            onClick={onAsk}
            disabled={asking || isOnCooldown}
            className="md:w-40"
          >
            {asking
              ? "Thinking…"
              : isOnCooldown
              ? `Wait ${Math.ceil(cooldownRemaining / 1000)}s`
              : "Ask"}
          </Button>
        </div>
        <div className="text-xs text-gray-500">
          {dryRun ? "Dry Run is enabled — no backend calls will be made." : "Live mode — responses use your configured model."}
          {isOnCooldown && " • Cooldown active to prevent rapid asks."}
        </div>
        {reply && (
          <div className="rounded-md border bg-white p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">Answer</div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onUseAsWorkflow}
                >
                  Use as Workflow
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onScheduleNow}
                >
                  Schedule Now
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onCopyAnswer}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
              </div>
            </div>
            <div className="text-sm leading-6 whitespace-pre-wrap">{reply}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
