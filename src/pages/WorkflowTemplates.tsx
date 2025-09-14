import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function WorkflowTemplatesPage() {
  const navigate = useNavigate();
  const { isLoading: authLoading, isAuthenticated } = useAuth();

  // Optional filters
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const builtIns = useQuery((api as any).workflowTemplates?.getBuiltInTemplates || ({} as any), {
    tier: tierFilter === "all" ? null : (tierFilter as any),
    search: search || null,
  });

  // To copy into a workspace, need a businessId. Reuse user's first business if exists.
  const businesses = useQuery(api.businesses.getUserBusinesses, {});
  const firstBizId = businesses?.[0]?._id;

  const copyBuiltIn = useMutation(((api as any).workflowTemplates?.copyBuiltInTemplate) || ({} as any));

  // Add: Default the tier filter to the user's business tier once loaded
  useEffect(() => {
    const bizTier = (businesses && businesses[0]?.tier) as string | undefined;
    if (tierFilter === "all" && bizTier && ["solopreneur", "startup", "sme", "enterprise"].includes(bizTier)) {
      setTierFilter(bizTier);
    }
  }, [businesses, tierFilter]);

  if (authLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse h-8 w-40 rounded bg-muted mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 rounded-lg bg-muted" />
          <div className="h-28 rounded-lg bg-muted" />
          <div className="h-28 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in to view templates.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button onClick={() => navigate("/auth")}>Sign In</Button>
            <Button variant="outline" onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Workflow Templates</h1>
          <p className="text-sm text-muted-foreground">Browse 120 curated templates per tier. Copy any into your workspace.</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="solopreneur">Solopreneur</SelectItem>
              <SelectItem value="startup">Startup</SelectItem>
              <SelectItem value="sme">SME</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <Input
            className="w-56"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="outline" onClick={() => { setTierFilter("all"); setSearch(""); }}>
            Clear
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        {builtIns ? builtIns.length : 0} template{(builtIns?.length || 0) === 1 ? "" : "s"} found
      </div>

      <div className="grid gap-4">
        {(builtIns || []).map((template: any) => (
          <Card key={template._id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  {template.description && (
                    <CardDescription>{template.description}</CardDescription>
                  )}
                </div>
                <Button
                  disabled={!firstBizId}
                  onClick={async () => {
                    if (!firstBizId) {
                      toast.error("No business found. Complete onboarding first.");
                      return;
                    }
                    try {
                      await copyBuiltIn({ businessId: firstBizId as any, key: template._id });
                      toast.success("Template copied to your workflows");
                      navigate("/workflows");
                    } catch (e: any) {
                      toast.error(e?.message || "Failed to copy template");
                    }
                  }}
                >
                  Copy to Workflows
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Steps: {template.pipeline.length}</span>
                <span>Trigger: {template.trigger.type}</span>
              </div>
              {template.tags?.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {template.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}