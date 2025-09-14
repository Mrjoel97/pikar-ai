import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router";

export default function Onboarding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/10 via-background to-primary/5 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <Card className="neu-raised rounded-2xl border-0">
          <CardContent className="p-8">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight">Welcome to Pikar AI</h1>
              <p className="text-muted-foreground">
                Let’s get you set up quickly. You can adjust these settings later from Business or Workflows.
              </p>

              <div className="grid gap-4">
                <div className="neu-inset rounded-xl p-4 bg-card/60">
                  <p className="text-sm font-semibold mb-1">Getting started</p>
                  <p className="text-sm text-muted-foreground">
                    Explore the dashboard, seed demo data, and try creating your first workflow or email campaign.
                  </p>
                </div>
                <div className="neu-inset rounded-xl p-4 bg-card/60">
                  <p className="text-sm font-semibold mb-1">Next steps</p>
                  <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                    <li>Visit the Dashboard for tier-specific insights</li>
                    <li>Create a workflow from a template</li>
                    <li>Compose and send a test email</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button className="neu-raised rounded-xl" onClick={() => navigate("/dashboard")}>
                  Go to Dashboard
                </Button>
                <Button variant="outline" className="neu-flat rounded-xl" onClick={() => navigate("/")}>
                  Back to Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
