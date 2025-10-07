import { useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { BookOpen, GraduationCap, HelpCircle, MessageCircleQuestion, Bot, Send, Lightbulb, Info, Shield } from "lucide-react";
import ContextualTipsStrip from "@/components/landing/ContextualTipsStrip";

type Tier = "solopreneur" | "startup" | "sme" | "enterprise";

const TIER_LABELS: Record<Tier, string> = {
  solopreneur: "Solopreneur",
  startup: "Startup",
  sme: "SME",
  enterprise: "Enterprise",
};

const normalizeTier = (param?: string): Tier => {
  const k = (param || "").toLowerCase();
  if (k.includes("solo")) return "solopreneur";
  if (k.includes("start")) return "startup";
  if (k.includes("sme")) return "sme";
  if (k.includes("enterprise")) return "enterprise";
  return "startup";
};

export default function LearningHubPage() {
  const shouldReduceMotion = useReducedMotion();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const initialTier = normalizeTier(params.get("tier") || undefined);
  const [tier, setTier] = useState<Tier>(initialTier);

  const [aiGuideOpen, setAiGuideOpen] = useState(false);
  const [gdprTipOpen, setGdprTipOpen] = useState(false);
  const [learningOpen, setLearningOpen] = useState<null | { id: string; title: string; description: string }>(null);
  const [aiChatInput, setAiChatInput] = useState("");
  const [aiMessages, setAiMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "Hi! I'm your AI Guide. Ask about best practices or where to start by tier." },
  ]);

  const tips = useMemo(() => {
    const base = [
      { phase: "Planning", tip: "Use DTFL to align goals with measurable outcomes.", icon: Lightbulb },
      { phase: "Scheduling", tip: "Batch work early in week; A/B test send times.", icon: Info },
      { phase: "Compliance", tip: "Ensure consent and purpose limitation. Log processing.", icon: Shield },
    ];
    return base;
  }, []);

  const learningPaths = useMemo(() => {
    const map: Record<Tier, Array<{ id: string; title: string; description: string }>> = {
      solopreneur: [
        { id: "solo-email-101", title: "Your first newsletter", description: "Build and schedule a simple, on-brand newsletter." },
        { id: "solo-workflow-basics", title: "1-click workflows", description: "Turn ideas into lightweight, actionable flows." },
        { id: "solo-micro-analytics", title: "Micro-analytics", description: "Read quick KPIs and apply small weekly improvements." },
        { id: "solo-social-media", title: "Social Media Basics", description: "Connect accounts, schedule posts, and track engagement across 2 platforms." },
      ],
      startup: [
        { id: "startup-email", title: "Team campaign setup", description: "Coordinate campaigns across roles and approvals." },
        { id: "startup-automation", title: "Scale workflows", description: "Standardize processes with approvals and guardrails." },
        { id: "startup-insights", title: "Diagnostics basics", description: "Use analytics to detect bottlenecks and ROI leaks." },
        { id: "startup-social-collab", title: "Team Social Media", description: "Collaborate on posts, manage approvals, and track performance across 3 platforms." },
      ],
      sme: [
        { id: "sme-compliance", title: "Compliance preflight", description: "Apply policy checks and SLA floors to operations." },
        { id: "sme-governance", title: "Governance workflows", description: "Enforce multi-approver chains and role diversity." },
        { id: "sme-exec", title: "Executive summaries", description: "Roll up department metrics and SLA signals." },
        { id: "sme-social-advanced", title: "Advanced Social Strategy", description: "Multi-brand management, competitor analysis, and ROI tracking across 5 platforms." },
      ],
      enterprise: [
        { id: "ent-governance", title: "Global governance", description: "Regional controls, multi-brand orchestration." },
        { id: "ent-agents", title: "Agent federation", description: "Coordinate specialized agents with org guardrails." },
        { id: "ent-observability", title: "Observability and risk", description: "SLA sweeps, alerts, and policy heatmaps." },
        { id: "ent-social-enterprise", title: "Enterprise Social Command", description: "Global multi-brand social media orchestration with API access and white-label reporting." },
      ],
    };
    return map[tier];
  }, [tier]);

  const sampleArticles = useMemo(
    () => [
      { id: "gdpr", title: "GDPR for Marketers", summary: "Consent, minimization, DSAR basics." },
      { id: "snap", title: "SNAP Selling Guide", summary: "Simple, iNvaluable, Aligned, Priority." },
      { id: "dtfl", title: "Design Thinking (DTFL)", summary: "Define, Ideate, Prototype, Validate." },
      { id: "social-best-practices", title: "Social Media Best Practices", summary: "Optimal posting times, content strategies, and engagement tips." },
      { id: "social-troubleshooting", title: "Social Media Troubleshooting", summary: "Common issues and solutions for platform connections and posting." },
    ],
    [],
  );

  const handleAiSend = () => {
    const text = aiChatInput.trim();
    if (!text) return;
    setAiMessages((m) => [...m, { role: "user", content: text }]);
    setAiChatInput("");
    const reply =
      text.toLowerCase().includes("governance")
        ? "Start with a policy checklist, add approver diversity, and set SLA floors per tier."
        : text.toLowerCase().includes("workflow")
        ? "Try a 3-step flow: Ingest → Decision/Approval → Action. Add guardrails and observability."
        : "Iterate in small steps. Use templates by tier and adjust weekly based on KPIs.";
    setTimeout(() => setAiMessages((m) => [...m, { role: "assistant", content: reply }]), 250);
  };

  return (
    <div className="min-h-screen">
      <section className="px-4 sm:px-6 lg:px-8 py-8 border-b">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Learning Hub</h1>
            <p className="text-sm text-muted-foreground">
              Tier-adapted guides, tips, and assistant to help you ramp quickly.
            </p>
          </div>
          <div className="w-full sm:w-64">
            <Select
              value={tier}
              onValueChange={(v: Tier) => {
                setTier(v);
                params.set("tier", v);
                setParams(params, { replace: true });
              }}
            >
              <SelectTrigger className="neu-inset rounded-xl">
                <SelectValue placeholder="Select a tier" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="solopreneur">Solopreneur</SelectItem>
                <SelectItem value="startup">Startup</SelectItem>
                <SelectItem value="sme">SME</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <ContextualTipsStrip tips={tips} />

      <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {TIER_LABELS[tier]} Learning Paths
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Curated, actionable steps for your tier.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {learningPaths.map((lp, idx) => (
              <motion.div
                key={lp.id}
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: shouldReduceMotion ? 0 : idx * 0.05 }}
                viewport={{ once: true }}
              >
                <Card className="neu-raised rounded-2xl border-0 h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">{lp.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">{lp.description}</p>
                    <div className="flex gap-2">
                      <Button className="neu-flat rounded-xl" onClick={() => setLearningOpen(lp)}>
                        Start Path
                      </Button>
                      <Button
                        variant="outline"
                        className="neu-flat rounded-xl"
                        onClick={() => setGdprTipOpen(true)}
                      >
                        KnowledgeSelector
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <button
        aria-label="Open AI Guide"
        className="fixed right-6 z-50 neu-raised rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors p-4 bottom-[calc(1.5rem+env(safe-area-inset-bottom))]"
        onClick={() => setAiGuideOpen(true)}
      >
        <MessageCircleQuestion className="h-6 w-6" />
      </button>

      <Dialog open={aiGuideOpen} onOpenChange={setAiGuideOpen}>
        <DialogContent className="max-w-2xl w-[92vw] neu-raised rounded-2xl border-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              AI Guide
            </DialogTitle>
            <DialogDescription>Ask questions about using Pikar by tier.</DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 flex flex-col gap-3">
            <div className="h-64 neu-inset rounded-xl overflow-hidden">
              <ScrollArea className="h-64 p-4">
                <div className="space-y-3">
                  {aiMessages.map((m, idx) => (
                    <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                          m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ask about features, tips, or troubleshooting…"
                value={aiChatInput}
                onChange={(e) => setAiChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAiSend();
                }}
              />
              <Button className="neu-flat rounded-xl" onClick={handleAiSend}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!learningOpen} onOpenChange={() => setLearningOpen(null)}>
        <DialogContent className="max-w-2xl w-[92vw] neu-raised rounded-2xl border-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-3">
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {learningOpen?.title ?? "Learning Path"}
            </DialogTitle>
            <DialogDescription>{learningOpen?.description}</DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="neu-inset rounded-xl p-4">
                <p className="text-sm font-medium mb-2">Step 1: Preparation</p>
                <p className="text-sm text-muted-foreground">
                  Define audience and objectives aligned to {TIER_LABELS[tier]} priorities.
                </p>
              </div>
              <div className="neu-inset rounded-xl p-4">
                <p className="text-sm font-medium mb-2">Step 2: Configure</p>
                <p className="text-sm text-muted-foreground">
                  Select agents, add approvals, and set cadence for your tier.
                </p>
              </div>
              <div className="neu-inset rounded-xl p-4">
                <p className="text-sm font-medium mb-2">Step 3: Validate</p>
                <p className="text-sm text-muted-foreground">
                  Dry-run and review outputs. Iterate quickly with small diffs.
                </p>
              </div>
              <div className="neu-inset rounded-xl p-4">
                <p className="text-sm font-medium mb-2">Step 4: Launch</p>
                <p className="text-sm text-muted-foreground">
                  Schedule or trigger events; track analytics and adjust weekly.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Notes</p>
              <Textarea placeholder="Capture insights or action items…" />
            </div>
            <div className="flex justify-end">
              <Button className="neu-flat rounded-xl" onClick={() => setLearningOpen(null)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={gdprTipOpen} onOpenChange={setGdprTipOpen}>
        <DialogContent className="max-w-xl w-[92vw] neu-raised rounded-2xl border-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              KnowledgeSelector
            </DialogTitle>
            <DialogDescription>
              Pull relevant knowledge into your flow. Example: GDPR when uploading customer data.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            <div className="space-y-3">
              {sampleArticles.map((a) => (
                <div key={a.id} className="neu-inset rounded-xl p-4">
                  <p className="text-sm font-semibold">{a.title}</p>
                  <p className="text-sm text-muted-foreground">{a.summary}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button className="neu-flat rounded-xl" onClick={() => setGdprTipOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}