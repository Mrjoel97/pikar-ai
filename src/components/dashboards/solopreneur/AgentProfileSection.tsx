import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AgentProfileSectionProps {
  agentProfile: any;
  onSaveProfile: (partial: {
    tone?: "concise" | "friendly" | "premium";
    persona?: "maker" | "coach" | "executive";
    cadence?: "light" | "standard" | "aggressive";
  }) => Promise<void>;
}

export function AgentProfileSection({
  agentProfile,
  onSaveProfile,
}: AgentProfileSectionProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">Agent Profile</h2>
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Brand Tone</div>
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
                  onClick={() => onSaveProfile({ tone: t })}
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
                  variant={agentProfile?.persona === p ? "default" : "outline"}
                  className={
                    agentProfile?.persona === p
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : ""
                  }
                  onClick={() => onSaveProfile({ persona: p })}
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
                  variant={agentProfile?.cadence === c ? "default" : "outline"}
                  className={
                    agentProfile?.cadence === c
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : ""
                  }
                  onClick={() => onSaveProfile({ cadence: c })}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
