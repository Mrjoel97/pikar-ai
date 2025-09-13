import { Sidebar } from "@/components/layout/Sidebar";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTierConfig } from "@/lib/tierConfig";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export default function PricingPage() {
  const navigate = useNavigate();
  const tiers = ["solopreneur", "startup", "sme", "enterprise"] as const;

  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const sendInquiry = useAction(api.emailsActions.sendSalesInquiry);

  const submitInquiry = async () => {
    try {
      if (!name || !email || !message) throw new Error("Please fill required fields");
      await sendInquiry({ name, email, company, message, plan: plan || undefined } as any);
      setOpen(false);
      setName(""); setEmail(""); setCompany(""); setMessage(""); setPlan(null);
      toast.success("Thanks! Our team will reach out shortly.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to send inquiry");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        items={getTierConfig("solopreneur").sidebarItems}
        userDisplay="Guest"
        planLabel="Pricing"
        onNavigate={(to) => navigate(to)}
        onLogout={() => navigate("/")}
        featureHighlights={[]}
      />

      <main className="md:ml-72 p-6">
        <section className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Pricing</h1>
              <p className="text-sm text-muted-foreground">
                Choose a plan that fits your stage and scale.
              </p>
            </div>
            <Button onClick={() => navigate("/auth")}>Get Started</Button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {tiers.map((t) => {
            const cfg = getTierConfig(t);
            return (
              <Card key={t} className={t === "startup" ? "border-emerald-300" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span>{cfg.label}</span>
                    {t === "startup" && (
                      <Badge className="bg-emerald-600">Popular</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-3xl font-bold">
                    {t === "solopreneur" ? "$0" : t === "startup" ? "$49" : t === "sme" ? "$199" : "Custom"}
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {cfg.featureHighlights.slice(0, 4).map((f) => (
                      <li key={f}>• {f}</li>
                    ))}
                    {cfg.featureHighlights.length > 4 && (
                      <li>• +{cfg.featureHighlights.length - 4} more</li>
                    )}
                  </ul>
                  <Button
                    className="w-full"
                    variant={t === "startup" ? "default" : "outline"}
                    onClick={() => {
                      if (t === "enterprise") {
                        setPlan("Enterprise");
                        setOpen(true);
                      } else {
                        navigate(`/auth?tier=${t}`);
                      }
                    }}
                  >
                    {t === "enterprise" ? "Contact Sales" : "Choose Plan"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-3">What's included</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Governance & Approvals</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <div>• Role-based approvals (Startup+)</div>
                <div>• Department workflows (SME+)</div>
                <div>• Enterprise SSO & RBAC (Enterprise)</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Analytics & KPIs</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <div>• KPI snapshots</div>
                <div>• Trends and benchmarks (Startup+)</div>
                <div>• Cross-region insights (Enterprise)</div>
              </CardContent>
            </Card>
          </div>
        </section>

        <FeatureMatrix />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Contact Sales {plan ? `— ${plan}` : ""}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Your Name *" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Your Email *" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input placeholder="Company (optional)" value={company} onChange={(e) => setCompany(e.target.value)} />
              <Textarea placeholder="How can we help? *" value={message} onChange={(e) => setMessage(e.target.value)} />
              <div className="flex items-center justify-end gap-2">
                <button className="px-3 py-2 border rounded-md" onClick={() => setOpen(false)}>Cancel</button>
                <button className="px-3 py-2 rounded-md bg-emerald-600 text-white" onClick={submitInquiry}>Send</button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

const FeatureMatrix = () => (
  <div className="mt-8 border rounded-lg overflow-hidden">
    <div className="grid grid-cols-4 bg-muted/50 px-4 py-3 text-sm font-medium">
      <div>Feature</div>
      <div className="text-center">Solopreneur</div>
      <div className="text-center">Startup</div>
      <div className="text-center">SME / Enterprise</div>
    </div>
    {[
      ["KPI Trends", "Basic", "Advanced", "Advanced + Benchmarks"],
      ["Notifications Center", "Core", "Core + Filters", "Full + Preferences"],
      ["Approvals & Audit", "—", "Basic", "Advanced (SLA, Escalation)"],
      ["Feature Flags", "—", "Basic", "Full (Rollout)"],
      ["Integrations", "—", "Popular", "Full + Logs"],
      ["Support", "Community", "Standard", "Priority / Dedicated"]
    ].map(([feat, s, st, sm]) => (
      <div key={feat} className="grid grid-cols-4 px-4 py-3 text-sm border-t">
        <div>{feat}</div>
        <div className="text-center">{s}</div>
        <div className="text-center">{st}</div>
        <div className="text-center">{sm}</div>
      </div>
    ))}
  </div>
);