import { Sidebar } from "@/components/layout/Sidebar";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTierConfig } from "@/lib/tierConfig";

export default function PricingPage() {
  const navigate = useNavigate();
  const tiers = ["solopreneur", "startup", "sme", "enterprise"] as const;

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
                    onClick={() => navigate(`/auth?tier=${t}`)}
                  >
                    {t === "enterprise" ? "Contact Sales" : "Choose Plan"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-3">What’s included</h2>
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
      </main>
    </div>
  );
}
