import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { SystemAgentsHub } from "@/components/admin/SystemAgentsHub";

export default function SystemAgentsPage() {
  const seedAgents = useAction(api.seed.seedAgentCatalog);
  const seedPlaybooks = useAction(api.playbooks.seedDefaultPlaybooks);
  const [busy, setBusy] = useState<"none" | "agents" | "playbooks">("none");

  const handleSeedAgents = async () => {
    try {
      setBusy("agents");
      await seedAgents({});
      toast.success("Seeded default agents");
    } catch (e: any) {
      toast.error(e?.message || "Failed to seed agents");
    } finally {
      setBusy("none");
    }
  };

  const handleSeedPlaybooks = async () => {
    try {
      setBusy("playbooks");
      await seedPlaybooks({});
      toast.success("Seeded default playbooks");
    } catch (e: any) {
      toast.error(e?.message || "Failed to seed playbooks");
    } finally {
      setBusy("none");
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-6">
      <Card className="neu-raised">
        <CardHeader>
          <CardTitle>System Agents Hub</CardTitle>
          <CardDescription>
            Manage built-in agents and orchestration playbooks. If this is your first time here, seed defaults below.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            size="sm"
            variant="default"
            onClick={handleSeedAgents}
            disabled={busy !== "none"}
            className="rounded-lg"
          >
            {busy === "agents" ? "Seeding Agents..." : "Seed Default Agents"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSeedPlaybooks}
            disabled={busy !== "none"}
            className="rounded-lg"
          >
            {busy === "playbooks" ? "Seeding Playbooks..." : "Seed Default Playbooks"}
          </Button>
        </CardContent>
      </Card>

      {/* Full Hub UI */}
      <SystemAgentsHub />
    </div>
  );
}