import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ScenarioPlannerProps {
  businessId: Id<"businesses">;
}

export default function ScenarioPlanner({ businessId }: ScenarioPlannerProps) {
  const [budgetChange, setBudgetChange] = useState(0);
  const [resourceChange, setResourceChange] = useState(0);
  const [timeframe, setTimeframe] = useState(12);
  const [simulation, setSimulation] = useState<any>(null);

  const simulateScenario = useQuery(
    api.portfolioManagement.optimization.simulatePortfolioScenario,
    simulation ? { businessId, scenario: { budgetChange, resourceChange, timeframe } } : "skip"
  );

  const handleSimulate = () => {
    setSimulation({ budgetChange, resourceChange, timeframe });
    toast.success("Scenario simulation started");
  };

  const handleReset = () => {
    setBudgetChange(0);
    setResourceChange(0);
    setTimeframe(12);
    setSimulation(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Scenario Planner</CardTitle>
        <CardDescription>Simulate what-if scenarios for portfolio planning</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Budget Change (%)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[budgetChange]}
                onValueChange={(v) => setBudgetChange(v[0])}
                min={-50}
                max={100}
                step={5}
                className="flex-1"
              />
              <span className="text-sm font-medium w-16 text-right">{budgetChange}%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Resource Change (%)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[resourceChange]}
                onValueChange={(v) => setResourceChange(v[0])}
                min={-50}
                max={100}
                step={5}
                className="flex-1"
              />
              <span className="text-sm font-medium w-16 text-right">{resourceChange}%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Timeframe (months)</Label>
            <Input
              type="number"
              value={timeframe}
              onChange={(e) => setTimeframe(Number(e.target.value))}
              min={1}
              max={36}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSimulate} className="flex-1">
            <PlayCircle className="h-4 w-4 mr-2" />
            Run Simulation
          </Button>
          <Button onClick={handleReset} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        {simulateScenario && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Simulation Results</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Baseline Completion</div>
                  <div className="text-2xl font-bold">
                    {Math.round(simulateScenario.baseline.completionRate)}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Projected Completion</div>
                  <div className="text-2xl font-bold text-green-600">
                    {simulateScenario.simulated.completionRate}%
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">Budget Impact</span>
                <Badge variant={simulateScenario.impact.budgetDelta > 0 ? "default" : "secondary"}>
                  ${Math.abs(simulateScenario.impact.budgetDelta).toLocaleString()}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">Completion Delta</span>
                <Badge variant="outline">
                  {simulateScenario.impact.completionDelta > 0 ? "+" : ""}
                  {simulateScenario.impact.completionDelta}%
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">Risk Level</span>
                <Badge
                  variant="outline"
                  className={
                    simulateScenario.impact.riskLevel === "high"
                      ? "bg-red-100 text-red-700"
                      : simulateScenario.impact.riskLevel === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }
                >
                  {simulateScenario.impact.riskLevel}
                </Badge>
              </div>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-1">Recommendation</div>
              <div className="text-sm text-muted-foreground">
                {simulateScenario.recommendation}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
