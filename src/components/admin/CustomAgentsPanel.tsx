import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Edit } from "lucide-react";

interface CustomAgentsPanelProps {
  selectedTenantId: string;
  recentAudits: Array<any> | undefined;
}

export function CustomAgentsPanel({ selectedTenantId, recentAudits }: CustomAgentsPanelProps) {
  const [agentViewerOpen, setAgentViewerOpen] = useState(false);
  const [viewAgentId, setViewAgentId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [editForm, setEditForm] = useState({ trainingNotes: "", brandVoice: "" });

  const agentSummary = useQuery(
    api.aiAgents.adminCustomAgentSummary as any,
    selectedTenantId ? { tenantId: selectedTenantId } : {}
  ) as { total: number; byTenant: Array<{ businessId: string; count: number }> } | undefined;

  const agents = useQuery(
    api.aiAgents.listCustomAgents as any,
    selectedTenantId ? { businessId: selectedTenantId } : {}
  ) as Array<{
    _id: string;
    businessId: string;
    userId: string;
    brandVoice?: string;
    timezone?: string;
    lastUpdated?: number;
    trainingNotes?: string;
  }> | undefined;

  const adminUpdateAgentProfile = useMutation(api.aiAgents.adminUpdateAgentProfile as any);
  const adminMarkAgentDisabled = useMutation(api.aiAgents.adminMarkAgentDisabled as any);
  const deleteCustomAgent = useMutation(api.aiAgents.deleteCustomAgent as any);

  const handleOpenEdit = (agent: any) => {
    setSelectedAgent(agent);
    setEditForm({
      trainingNotes: agent.trainingNotes || "",
      brandVoice: agent.brandVoice || "",
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedAgent) return;
    try {
      await adminUpdateAgentProfile({
        profileId: selectedAgent._id,
        trainingNotes: editForm.trainingNotes,
        brandVoice: editForm.brandVoice,
      });
      toast.success("Agent profile updated successfully");
      setEditDialogOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update agent");
    }
  };

  const handleOpenDelete = (agent: any) => {
    setSelectedAgent(agent);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAgent) return;
    try {
      await deleteCustomAgent({ profileId: selectedAgent._id });
      toast.success("Custom agent deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedAgent(null);
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete agent");
    }
  };

  const viewAgentAudits = useMemo(() => {
    if (!viewAgentId) return [] as any[];
    const list = (recentAudits || []) as any[];
    return list.filter(
      (a) =>
        a.entityId === viewAgentId ||
        (a.details &&
          typeof a.details === "object" &&
          ((a.details.profileId && String(a.details.profileId) === viewAgentId) ||
            (a.details.agentId && String(a.details.agentId) === viewAgentId)))
    );
  }, [viewAgentId, recentAudits]);

  const agentTopIntents = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of viewAgentAudits) {
      const intent = (a?.details?.intent ?? "") as string;
      if (intent) counts[intent] = (counts[intent] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [viewAgentAudits]);

  const agentLastErrors = useMemo(() => {
    const errs: Array<{ when: number; message: string }> = [];
    for (const a of viewAgentAudits) {
      const action = String(a.action || "").toLowerCase();
      const msg = (a?.details?.error || a?.details?.message || "") as string;
      if (action.includes("error") || action.includes("fail") || msg) {
        errs.push({ when: a.createdAt as number, message: msg || action });
      }
    }
    return errs.slice(0, 5);
  }, [viewAgentAudits]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle id="section-custom-agents">Custom Agents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Read-only visibility with safe admin overrides (training notes, brand voice). Use tenant filter above to scope.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-md border">
              <div className="text-xs text-muted-foreground">Total Agents</div>
              <div className="text-xl font-semibold">{agentSummary?.total ?? 0}</div>
            </div>
            <div className="p-3 rounded-md border md:col-span-3">
              <div className="text-xs text-muted-foreground">Counts by Tenant</div>
              <div className="text-xs">
                {(agentSummary?.byTenant || []).slice(0, 6).map((t) => (
                  <span key={t.businessId} className="inline-block mr-2 mb-1 px-2 py-0.5 rounded border">
                    {t.businessId}: {t.count}
                  </span>
                ))}
                {!(agentSummary?.byTenant?.length) && <span className="text-muted-foreground">None</span>}
              </div>
            </div>
          </div>

          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-8 gap-2 p-3 bg-muted/40 text-xs font-medium">
                  <div>Tenant</div>
                  <div>User</div>
                  <div>Brand Voice</div>
                  <div>Timezone</div>
                  <div>Last Updated</div>
                  <div>Status</div>
                  <div className="col-span-2">Actions</div>
                </div>
                <Separator />
                <div className="divide-y max-h-[500px] overflow-y-auto">
              {(agents || []).map((a) => {
                const disabled = (a.trainingNotes || "").includes("[DISABLED]");
                return (
                  <div key={a._id} className="grid grid-cols-8 gap-2 p-3 text-sm items-center">
                    <div className="truncate text-xs" title={a.businessId}>{a.businessId}</div>
                    <div className="truncate text-xs" title={a.userId}>{a.userId}</div>
                    <div className="truncate text-xs">{a.brandVoice || "—"}</div>
                    <div className="truncate text-xs">{a.timezone || "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.lastUpdated ? new Date(a.lastUpdated).toLocaleDateString() : "—"}
                    </div>
                    <div>
                      <Badge variant={disabled ? "destructive" : "outline"} className="text-xs">
                        {disabled ? "Disabled" : "Active"}
                      </Badge>
                    </div>
                    <div className="col-span-2 flex gap-1 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2"
                        onClick={() => handleOpenEdit(a)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2"
                        onClick={async () => {
                          const reason = prompt("Reason for disabling this agent? (optional)") || "";
                          try {
                            await adminMarkAgentDisabled({ profileId: a._id, reason });
                            toast.success("Agent marked disabled");
                          } catch (e: any) {
                            toast.error(e?.message || "Failed to mark disabled");
                          }
                        }}
                        disabled={disabled}
                      >
                        Disable
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs h-7 px-2"
                        onClick={() => handleOpenDelete(a)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs h-7 px-2"
                        onClick={() => {
                          setViewAgentId(a._id);
                          setAgentViewerOpen(true);
                        }}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                );
              })}
              {(!agents || agents.length === 0) && (
                <div className="p-3 text-sm text-muted-foreground">
                  {selectedTenantId ? "No agents for this tenant." : "No agents found."}
                </div>
              )}
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Guardrails: Admin-only; all operations audited. "Disable" adds a sentinel to notes. For full isolation, use
            tenant-scoped feature flags.
          </div>
        </CardContent>
      </Card>

      <Drawer open={agentViewerOpen} onOpenChange={setAgentViewerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Agent Session</DrawerTitle>
            <DrawerDescription className="text-sm">Agent: {viewAgentId || "—"}</DrawerDescription>
          </DrawerHeader>
          <div className="px-6 pb-6 space-y-4">
            <div>
              <div className="text-sm font-medium mb-1">Top Intents</div>
              <div className="flex flex-wrap gap-2">
                {agentTopIntents.length > 0 ? (
                  agentTopIntents.map(([intent, count]) => (
                    <Badge key={intent as string} variant="outline">
                      {String(intent)}: {String(count)}
                    </Badge>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No intents observed.</div>
                )}
              </div>
            </div>
            <Separator />
            <div>
              <div className="text-sm font-medium mb-1">Recent Activity</div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {viewAgentAudits.map((ev: any, idx: number) => (
                  <div key={ev._id || idx} className="p-2 rounded border">
                    <div className="text-xs text-muted-foreground">
                      {ev.createdAt ? new Date(ev.createdAt).toLocaleString() : "—"}
                    </div>
                    <div className="text-sm font-medium">{ev.action || "event"}</div>
                    <div className="text-xs break-words text-muted-foreground">
                      {(() => {
                        try {
                          const preview = JSON.stringify(ev.details ?? {}, null, 0);
                          return preview.length > 240 ? preview.slice(0, 240) + "…" : preview;
                        } catch {
                          return "—";
                        }
                      })()}
                    </div>
                  </div>
                ))}
                {viewAgentAudits.length === 0 && (
                  <div className="text-sm text-muted-foreground">No recent activity for this agent.</div>
                )}
              </div>
            </div>
            <Separator />
            <div>
              <div className="text-sm font-medium mb-1">Last Errors</div>
              <div className="space-y-1">
                {agentLastErrors.length > 0 ? (
                  agentLastErrors.map((e, i) => (
                    <div key={i} className="text-xs">
                      <span className="text-muted-foreground mr-2">{new Date(e.when).toLocaleString()}:</span>
                      <span>{e.message || "Error"}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">None</div>
                )}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Agent Profile</DialogTitle>
            <DialogDescription>
              Update training notes and brand voice for {selectedAgent?.businessId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="trainingNotes">Training Notes</Label>
              <Textarea
                id="trainingNotes"
                placeholder="Add context, guidelines, or instructions for this agent..."
                value={editForm.trainingNotes}
                onChange={(e) => setEditForm({ ...editForm, trainingNotes: e.target.value })}
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                These notes will guide the agent's behavior without modifying its core configuration
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandVoice">Brand Voice</Label>
              <Input
                id="brandVoice"
                placeholder="e.g., casual, formal, friendly, professional"
                value={editForm.brandVoice}
                onChange={(e) => setEditForm({ ...editForm, brandVoice: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Define the tone and style for agent communications
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Custom Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this custom agent? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              <strong>Tenant:</strong> {selectedAgent?.businessId}
            </p>
            <p className="text-sm">
              <strong>User:</strong> {selectedAgent?.userId}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
