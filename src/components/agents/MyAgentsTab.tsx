import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

export default function MyAgentsTab({
  userId,
}: {
  userId?: Id<"users">;
  // Make selectedTier optional to avoid prop mismatch warnings/errors
  selectedTier?: string;
}) {
  // Fetch current user to derive businessId
  const currentUser = useQuery(api.users.currentUser, {});
  const userBusinesses = useQuery(api.businesses.getUserBusinesses, {});
  const businessId = (userBusinesses && userBusinesses[0]?._id) as Id<"businesses"> | undefined;

  const agents = useQuery(
    api.aiAgents.listCustomAgents,
    businessId ? ({ businessId } as any) : undefined,
  );

  // Fetch Pikar AI App Agents for the user's business
  const pikarAgents = useQuery(
    api.aiAgents.getByBusiness,
    businessId ? ({ businessId } as any) : undefined
  );

  const seedEnhanced = useMutation(api.aiAgents.seedEnhancedForBusiness);
  const createCustomAgent = useMutation(api.aiAgents.createCustomAgent);

  // Local state for "Create Custom Agent" dialog
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string>("");
  const [visibility, setVisibility] = useState<"private" | "team" | "market">("private");
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">("low");

  // Add: guest mode
  const guestMode = !userId;

  const handleSeed = async () => {
    if (!businessId) {
      toast("No business linked to your account yet.");
      return;
    }
    try {
      await seedEnhanced({ businessId });
      toast("Pikar AI App Agents added to your workspace.");
    } catch (e: any) {
      toast(`Failed to add agents: ${e?.message ?? "Unknown error"}`);
    }
  };

  const handleCreateCustom = async () => {
    if (!userId || !businessId) {
      toast("You must be signed in with a business to create agents.");
      return;
    }
    if (!name.trim()) {
      toast("Please provide a name.");
      return;
    }
    try {
      await createCustomAgent({
        name: name.trim(),
        description: description.trim() || "Custom agent",
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        config: {},
        businessId,
        userId,
        visibility,
        riskLevel,
      } as any);
      toast("Custom agent created.");
      setOpen(false);
      setName("");
      setDescription("");
      setTags("");
      setVisibility("private");
      setRiskLevel("low");
    } catch (e: any) {
      toast(`Failed to create agent: ${e?.message ?? "Unknown error"}`);
    }
  };

  if (agents === undefined || (businessId && pikarAgents === undefined)) {
    return <div className="text-gray-600">Loading your agents...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold">My Agents</h3>
          <p className="text-sm text-gray-600">Your custom agents and built-in Pikar AI app agents.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!guestMode && (
            <>
              <Button variant="secondary" onClick={handleSeed} disabled={!businessId}>
                Add Pikar AI App Agents
              </Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Custom Agent
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Custom Agent</DialogTitle>
                    <DialogDescription>Start from a blank slate without using a template.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Outreach Assistant" />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this agent do?" />
                    </div>
                    <div className="space-y-2">
                      <Label>Tags (comma separated)</Label>
                      <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="sales, outreach, email" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Visibility</Label>
                        <Select value={visibility} onValueChange={(v) => setVisibility(v as any)}>
                          <SelectTrigger><SelectValue placeholder="Select visibility" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="private">Private</SelectItem>
                            <SelectItem value="team">Team</SelectItem>
                            <SelectItem value="market">Market</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Risk Level</Label>
                        <Select value={riskLevel} onValueChange={(v) => setRiskLevel(v as any)}>
                          <SelectTrigger><SelectValue placeholder="Select risk level" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateCustom} disabled={!userId || !businessId}>
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Pikar AI App Agents */}
      <div className="space-y-3">
        <h4 className="text-lg font-semibold">Pikar AI App Agents</h4>
        {!businessId ? (
          <Card>
            <CardHeader>
              <CardTitle>Connect to a Business</CardTitle>
              <CardDescription>Link your account to a business to view built-in app agents.</CardDescription>
            </CardHeader>
          </Card>
        ) : pikarAgents && pikarAgents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl-grid-cols-3 xl:grid-cols-3 gap-4">
            {pikarAgents.map((a: any) => (
              <Card key={a._id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{a.name}</span>
                    <Badge variant="secondary">{a.isActive ? "Active" : "Inactive"}</Badge>
                  </CardTitle>
                  <CardDescription>{a.description || "Built-in agent"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {!!(a.capabilities?.length) && (
                    <div className="flex flex-wrap gap-2">
                      {a.capabilities.map((t: string) => (
                        <Badge key={t} variant="outline">{t}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="text-sm text-gray-500">
                    Tasks: {a.performance?.tasksCompleted ?? 0} • Success Rate: {(a.performance?.successRate ?? 0)}%
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No built-in agents found</CardTitle>
              <CardDescription>Click "Add Pikar AI App Agents" to populate your workspace.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      {/* Custom Agents */}
      <div className="space-y-3">
        <h4 className="text-lg font-semibold">Your Custom Agents</h4>
        {agents && agents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {agents.map((a: any) => (
              <Card key={a._id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{a.name}</span>
                    <Badge variant="secondary">{a.visibility}</Badge>
                  </CardTitle>
                  <CardDescription>{a.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {(a.tags || []).map((t: string) => (
                      <Badge key={t} variant="outline">{t}</Badge>
                    ))}
                  </div>
                  <div className="text-sm text-gray-500">
                    Runs: {a.stats?.runs ?? 0} • Successes: {a.stats?.successes ?? 0}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No custom agents yet</CardTitle>
              <CardDescription>Create agents from scratch with the button above, or from templates.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}