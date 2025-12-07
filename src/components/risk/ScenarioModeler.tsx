import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, TrendingUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ScenarioModelerProps {
  businessId: Id<"businesses">;
}

export function ScenarioModeler({ businessId }: ScenarioModelerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<Id<"riskScenarios"> | null>(null);

  const scenarios = useQuery(api.risk.scenarios.listScenarios, { businessId });
  const scenarioResults = useQuery(
    api.risk.scenarios.getScenarioResults,
    selectedScenario ? { scenarioId: selectedScenario } : "skip"
  );

  const createScenario = useMutation(api.risk.scenarios.createScenario);
  const runSimulation = useMutation(api.risk.scenarios.runScenarioSimulation);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "operational",
    timeframe: "30d",
    assumptions: [{ factor: "", value: "", impact: "" }],
  });

  const handleCreateScenario = async () => {
    try {
      const scenarioId = await createScenario({
        businessId,
        ...formData,
      });
      toast.success("Scenario created successfully");
      setIsCreateOpen(false);
      setFormData({
        name: "",
        description: "",
        category: "operational",
        timeframe: "30d",
        assumptions: [{ factor: "", value: "", impact: "" }],
      });
    } catch (error) {
      toast.error("Failed to create scenario");
    }
  };

  const handleRunSimulation = async (scenarioId: Id<"riskScenarios">) => {
    try {
      await runSimulation({ scenarioId, iterations: 1000 });
      toast.success("Simulation completed");
      setSelectedScenario(scenarioId);
    } catch (error) {
      toast.error("Failed to run simulation");
    }
  };

  const addAssumption = () => {
    setFormData({
      ...formData,
      assumptions: [...formData.assumptions, { factor: "", value: "", impact: "" }],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Risk Scenario Modeler</h2>
          <p className="text-muted-foreground">Model and simulate risk scenarios</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Scenario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Create Risk Scenario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Scenario Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Market Downturn 2024"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the scenario..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="strategic">Strategic</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="reputational">Reputational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Timeframe</Label>
                  <Select value={formData.timeframe} onValueChange={(v) => setFormData({ ...formData, timeframe: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30d">30 Days</SelectItem>
                      <SelectItem value="90d">90 Days</SelectItem>
                      <SelectItem value="6m">6 Months</SelectItem>
                      <SelectItem value="1y">1 Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Assumptions</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addAssumption}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
                {formData.assumptions.map((assumption, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2 mb-2">
                    <Input
                      placeholder="Factor"
                      value={assumption.factor}
                      onChange={(e) => {
                        const newAssumptions = [...formData.assumptions];
                        newAssumptions[idx].factor = e.target.value;
                        setFormData({ ...formData, assumptions: newAssumptions });
                      }}
                    />
                    <Input
                      placeholder="Value"
                      value={assumption.value}
                      onChange={(e) => {
                        const newAssumptions = [...formData.assumptions];
                        newAssumptions[idx].value = e.target.value;
                        setFormData({ ...formData, assumptions: newAssumptions });
                      }}
                    />
                    <Input
                      placeholder="Impact"
                      value={assumption.impact}
                      onChange={(e) => {
                        const newAssumptions = [...formData.assumptions];
                        newAssumptions[idx].impact = e.target.value;
                        setFormData({ ...formData, assumptions: newAssumptions });
                      }}
                    />
                  </div>
                ))}
              </div>
              <Button onClick={handleCreateScenario} className="w-full">
                Create Scenario
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scenarios?.map((scenario: any) => (
          <Card key={scenario._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{scenario.name}</CardTitle>
                  <CardDescription className="mt-1">{scenario.description}</CardDescription>
                </div>
                <Badge variant={scenario.status === "simulated" ? "default" : "secondary"}>
                  {scenario.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium capitalize">{scenario.category}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Timeframe:</span>
                  <span className="font-medium">{scenario.timeframe}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Assumptions:</span>
                  <span className="font-medium">{scenario.assumptions.length}</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleRunSimulation(scenario._id)}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Run
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedScenario(scenario._id)}
                  >
                    View Results
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedScenario && scenarioResults && (
        <Card>
          <CardHeader>
            <CardTitle>Simulation Results</CardTitle>
            <CardDescription>Monte Carlo simulation with 1000 iterations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{scenarioResults.summary.avgRiskScore.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground mt-1">Avg Risk Score</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-red-600">{scenarioResults.summary.maxRiskScore.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground mt-1">Max Risk Score</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">{scenarioResults.summary.minRiskScore.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground mt-1">Min Risk Score</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{(scenarioResults.summary.confidence * 100).toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground mt-1">Confidence</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}