import React, { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Pencil, Power, PowerOff, Plus, RefreshCw } from "lucide-react";

type Agent = {
  _id: string;
  agent_key: string;
  display_name: string;
  short_desc: string;
  long_desc: string;
  capabilities: string[];
  default_model: string;
  model_routing: string;
  prompt_template_version: string;
  prompt_templates: string;
  input_schema: string;
  output_schema: string;
  tier_restrictions: string[];
  confidence_hint: number;
  active: boolean;
  createdAt: number;
  updatedAt?: number;
};

type Playbook = {
  _id: string;
  playbook_key: string;
  display_name: string;
  version: string;
  triggers: any;
  input_schema: any;
  output_schema: any;
  steps: any;
  metadata: any;
  active: boolean;
};

export function SystemAgentsHub() {
  const [activeTab, setActiveTab] = useState("catalog");
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editingPlaybook, setEditingPlaybook] = useState<Playbook | null>(null);

  // Queries
  const agents = useQuery(api.aiAgents.adminListAgents, {
    activeOnly: activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined,
    tier: tierFilter === "all" ? undefined : tierFilter,
  });

  const playbooks = useQuery(api.playbooks.adminListPlaybooks, {
    activeOnly: activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined,
  });

  // Mutations
  const upsertAgent = useMutation(api.aiAgents.adminUpsertAgent);
  const toggleAgent = useMutation(api.aiAgents.adminToggleAgent);
  const upsertPlaybook = useMutation(api.playbooks.adminUpsertPlaybook);
  const togglePlaybook = useMutation(api.playbooks.adminTogglePlaybook);
  // Use actions for seeding (they are Convex actions)
  const seedAgents = useAction(api.seed.seedAgentCatalog);
  const seedPlaybooks = useAction(api.playbooks.seedDefaultPlaybooks);

  // Filter agents
  const filteredAgents = agents?.filter((agent: Agent) => 
    agent.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.agent_key.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Filter playbooks
  const filteredPlaybooks = playbooks?.filter((playbook: Playbook) =>
    playbook.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    playbook.playbook_key.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleToggleAgent = async (agent_key: string, active: boolean) => {
    try {
      await toggleAgent({ agent_key, active });
      toast.success(`Agent ${active ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      toast.error(`Failed to ${active ? 'enable' : 'disable'} agent`);
    }
  };

  const handleTogglePlaybook = async (playbook_key: string, version: string, active: boolean) => {
    try {
      await togglePlaybook({ playbook_key, version, active });
      toast.success(`Playbook ${active ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      toast.error(`Failed to ${active ? 'enable' : 'disable'} playbook`);
    }
  };

  const handleSaveAgent = async (agentData: Partial<Agent>) => {
    try {
      await upsertAgent(agentData as any);
      toast.success("Agent saved successfully");
      setEditingAgent(null);
    } catch (error) {
      toast.error("Failed to save agent");
    }
  };

  const handleSavePlaybook = async (playbookData: Partial<Playbook>) => {
    try {
      await upsertPlaybook(playbookData as any);
      toast.success("Playbook saved successfully");
      setEditingPlaybook(null);
    } catch (error) {
      toast.error("Failed to save playbook");
    }
  };

  const handleSeedAgents = async () => {
    try {
      await seedAgents({});
      toast.success("Agents seeded successfully");
    } catch (error) {
      toast.error("Failed to seed agents");
    }
  };

  const handleSeedPlaybooks = async () => {
    try {
      await seedPlaybooks({});
      toast.success("Playbooks seeded successfully");
    } catch (error) {
      toast.error("Failed to seed playbooks");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">System Agents Hub</h2>
        <div className="flex gap-2">
          <Button onClick={handleSeedAgents} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Seed Agents
          </Button>
          <Button onClick={handleSeedPlaybooks} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Seed Playbooks
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="catalog">Agent Catalog</TabsTrigger>
          <TabsTrigger value="playbooks">Orchestrations</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="solopreneur">Solopreneur</SelectItem>
                <SelectItem value="startup">Startup</SelectItem>
                <SelectItem value="sme">SME</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Agents Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent Key</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Tiers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.map((agent: Agent) => (
                  <TableRow key={agent._id}>
                    <TableCell className="font-mono text-sm">{agent.agent_key}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{agent.display_name}</div>
                        <div className="text-sm text-muted-foreground">{agent.short_desc}</div>
                      </div>
                    </TableCell>
                    <TableCell>{agent.default_model}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {agent.tier_restrictions.length === 0 ? (
                          <Badge variant="secondary">All</Badge>
                        ) : (
                          agent.tier_restrictions.map((tier: string) => (
                            <Badge key={tier} variant="outline">{tier}</Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={agent.active ? "default" : "secondary"}>
                        {agent.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingAgent(agent)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleAgent(agent.agent_key, !agent.active)}
                        >
                          {agent.active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="playbooks" className="space-y-4">
          {/* Playbooks Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Playbook Key</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlaybooks.map((playbook: Playbook) => (
                  <TableRow key={playbook._id}>
                    <TableCell className="font-mono text-sm">{playbook.playbook_key}</TableCell>
                    <TableCell>{playbook.display_name}</TableCell>
                    <TableCell>{playbook.version}</TableCell>
                    <TableCell>
                      <Badge variant={playbook.active ? "default" : "secondary"}>
                        {playbook.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingPlaybook(playbook)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTogglePlaybook(playbook.playbook_key, playbook.version, !playbook.active)}
                        >
                          {playbook.active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="training">
          <div className="text-center py-8 text-muted-foreground">
            Training interface coming in Phase 3
          </div>
        </TabsContent>

        <TabsContent value="evaluations">
          <div className="text-center py-8 text-muted-foreground">
            Evaluations interface coming in Phase 4
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="text-center py-8 text-muted-foreground">
            Activity logs coming in Phase 6
          </div>
        </TabsContent>
      </Tabs>

      {/* Agent Edit Dialog */}
      {editingAgent && (
        <AgentEditDialog
          agent={editingAgent}
          onSave={handleSaveAgent}
          onClose={() => setEditingAgent(null)}
        />
      )}

      {/* Playbook Edit Dialog */}
      {editingPlaybook && (
        <PlaybookEditDialog
          playbook={editingPlaybook}
          onSave={handleSavePlaybook}
          onClose={() => setEditingPlaybook(null)}
        />
      )}
    </div>
  );
}

// Agent Edit Dialog Component
function AgentEditDialog({ 
  agent, 
  onSave, 
  onClose 
}: { 
  agent: Agent; 
  onSave: (data: Partial<Agent>) => void; 
  onClose: () => void; 
}) {
  const [formData, setFormData] = useState(agent);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Agent: {agent.display_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Agent Key</label>
              <Input
                value={formData.agent_key}
                onChange={(e) => setFormData({ ...formData, agent_key: e.target.value })}
                disabled
              />
            </div>
            <div>
              <label className="text-sm font-medium">Display Name</label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Short Description</label>
            <Input
              value={formData.short_desc}
              onChange={(e) => setFormData({ ...formData, short_desc: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Long Description</label>
            <Textarea
              value={formData.long_desc}
              onChange={(e) => setFormData({ ...formData, long_desc: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Default Model</label>
              <Input
                value={formData.default_model}
                onChange={(e) => setFormData({ ...formData, default_model: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Confidence Hint</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={formData.confidence_hint}
                onChange={(e) => setFormData({ ...formData, confidence_hint: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.active}
              onCheckedChange={(active) => setFormData({ ...formData, active })}
            />
            <label className="text-sm font-medium">Active</label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Playbook Edit Dialog Component
function PlaybookEditDialog({ 
  playbook, 
  onSave, 
  onClose 
}: { 
  playbook: Playbook; 
  onSave: (data: Partial<Playbook>) => void; 
  onClose: () => void; 
}) {
  const [formData, setFormData] = useState(playbook);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Playbook: {playbook.display_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Playbook Key</label>
              <Input
                value={formData.playbook_key}
                onChange={(e) => setFormData({ ...formData, playbook_key: e.target.value })}
                disabled
              />
            </div>
            <div>
              <label className="text-sm font-medium">Display Name</label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Version</label>
            <Input
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.active}
              onCheckedChange={(active) => setFormData({ ...formData, active })}
            />
            <label className="text-sm font-medium">Active</label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}