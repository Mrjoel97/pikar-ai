import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Play } from "lucide-react";
import { toast } from "sonner";

export function ScenarioModeler({ businessId }: { businessId: string }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("operational");
  const [likelihood, setLikelihood] = useState([3]);
  const [impact, setImpact] = useState([3]);
  const [timeframe, setTimeframe] = useState("medium-term");

  const scenarios = useQuery(api.risk.scenarios.listScenarios, { businessId: businessId as any });
  const createScenario = useMutation(api.risk.scenarios.createScenario);
  const runSimulation = useQuery(api.risk.scenarios.runSimulation, { 
    businessId: businessId as any, 
    iterations: 1000 
  });

  const handleCreate = async () => {
    if (!title || !description) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createScenario({
        businessId: businessId as any,
        title,
        description,
        category,
        likelihood: likelihood[0],
        impact: impact[0],
        timeframe,
        affectedAreas: [],
      });
      toast.success("Risk scenario created");
      setTitle("");
      setDescription("");
    } catch (error) {
      toast.error("Failed to create scenario");
    }
  };

  const riskScore = likelihood[0] * impact[0];
  const riskLevel = riskScore > 15 ? "Critical" : riskScore > 9 ? "High" : riskScore > 4 ? "Medium" : "Low";
  const riskColor = riskScore > 15 ? "destructive" : riskScore > 9 ? "default" : "secondary";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Risk Scenario</CardTitle>
          <CardDescription>Model potential risks and their impacts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Scenario Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Supply chain disruption"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the risk scenario..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
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

            <div className="space-y-2">
              <Label htmlFor="timeframe">Timeframe</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger id="timeframe">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="short-term">Short-term (0-6 months)</SelectItem>
                  <SelectItem value="medium-term">Medium-term (6-18 months)</SelectItem>
                  <SelectItem value="long-term">Long-term (18+ months)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Likelihood: {likelihood[0]}/5</Label>
            <Slider
              value={likelihood}
              onValueChange={setLikelihood}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Impact: {impact[0]}/5</Label>
            <Slider
              value={impact}
              onValueChange={setImpact}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">Risk Score</p>
              <p className="text-2xl font-bold">{riskScore}</p>
            </div>
            <Badge variant={riskColor as any}>{riskLevel}</Badge>
          </div>

          <Button onClick={handleCreate} className="w-full">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Create Scenario
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monte Carlo Simulation</CardTitle>
          <CardDescription>Run probabilistic risk analysis</CardDescription>
        </CardHeader>
        <CardContent>
          {runSimulation ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Avg Impact</p>
                  <p className="text-2xl font-bold">{runSimulation.avgImpact.toFixed(2)}</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Max Impact</p>
                  <p className="text-2xl font-bold">{runSimulation.maxImpact}</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Min Impact</p>
                  <p className="text-2xl font-bold">{runSimulation.minImpact}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Based on {runSimulation.iterations} iterations
              </p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Create scenarios to run simulation</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Scenarios ({scenarios?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {scenarios?.slice(0, 5).map((scenario: any) => (
              <div key={scenario._id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{scenario.title}</p>
                  <p className="text-sm text-muted-foreground">{scenario.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={scenario.riskScore > 15 ? "destructive" : "default"}>
                    Score: {scenario.riskScore}
                  </Badge>
                  <Badge variant="outline">{scenario.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
