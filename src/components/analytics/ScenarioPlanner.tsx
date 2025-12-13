import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Lightbulb, TrendingUp } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface ScenarioPlannerProps {
  businessId: Id<"businesses">;
  userId: Id<"users">;
}

export function ScenarioPlanner({ businessId, userId }: ScenarioPlannerProps) {
  const [hourlyRate, setHourlyRate] = useState(75);
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [efficiencyGain, setEfficiencyGain] = useState(20);
  const [days, setDays] = useState(30);

  const simulation = useQuery(
    api.analytics.optimization.simulateROIScenario,
    { businessId, userId, hourlyRate, hoursPerDay, efficiencyGain, days }
  );

  const scenarios = useQuery(
    api.analytics.predictiveROI.getScenarioAnalysis,
    {
      businessId,
      userId,
      scenarios: [
        { name: "Conservative", hourlyRateMultiplier: 1.0, efficiencyMultiplier: 1.1 },
        { name: "Moderate", hourlyRateMultiplier: 1.2, efficiencyMultiplier: 1.3 },
        { name: "Aggressive", hourlyRateMultiplier: 1.5, efficiencyMultiplier: 1.5 },
      ],
    }
  );

  if (!simulation || !scenarios) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scenario Planner</CardTitle>
          <CardDescription>Loading scenario analysis...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const comparisonData = [
    {
      name: "Baseline",
      revenue: scenarios.baseline.estimatedRevenue,
      hours: scenarios.baseline.timeSavedHours,
    },
    ...scenarios.scenarios.map((s: any) => ({
      name: s.name,
      revenue: s.estimatedRevenue,
      hours: s.timeSavedHours,
    })),
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            What-If Scenario Planner
          </CardTitle>
          <CardDescription>Adjust parameters to see potential ROI impact</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sliders */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Hourly Rate</Label>
                <Badge variant="outline">${hourlyRate}/hr</Badge>
              </div>
              <Slider
                value={[hourlyRate]}
                onValueChange={(v) => setHourlyRate(v[0])}
                min={25}
                max={200}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Hours Saved Per Day</Label>
                <Badge variant="outline">{hoursPerDay}h</Badge>
              </div>
              <Slider
                value={[hoursPerDay]}
                onValueChange={(v) => setHoursPerDay(v[0])}
                min={0.5}
                max={8}
                step={0.5}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Efficiency Gain</Label>
                <Badge variant="outline">{efficiencyGain}%</Badge>
              </div>
              <Slider
                value={[efficiencyGain]}
                onValueChange={(v) => setEfficiencyGain(v[0])}
                min={5}
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Time Period</Label>
                <Badge variant="outline">{days} days</Badge>
              </div>
              <Slider
                value={[days]}
                onValueChange={(v) => setDays(v[0])}
                min={7}
                max={365}
                step={7}
              />
            </div>
          </div>

          {/* Results */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <h4 className="font-semibold text-sm">Projected Results</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Daily Time Saved</div>
                <div className="text-xl font-bold">{simulation.results.dailyTimeSaved}h</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Daily Revenue</div>
                <div className="text-xl font-bold text-green-600">
                  ${simulation.results.dailyRevenue}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total Time Saved</div>
                <div className="text-xl font-bold">{simulation.results.totalTimeSaved}h</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total Revenue</div>
                <div className="text-xl font-bold text-green-600">
                  ${simulation.results.totalRevenue}
                </div>
              </div>
            </div>
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground">Annualized Revenue</div>
              <div className="text-2xl font-bold text-blue-600">
                ${simulation.results.annualizedRevenue.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenario Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Scenario Comparison
          </CardTitle>
          <CardDescription>Compare different growth scenarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue ($)" />
                <Bar dataKey="hours" fill="#3b82f6" name="Hours Saved" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            {scenarios.scenarios.map((scenario: any) => (
              <div key={scenario.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-semibold">{scenario.name}</div>
                  <div className="text-sm text-muted-foreground">
                    ${scenario.hourlyRate}/hr • {scenario.timeSavedHours}h saved
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    ${scenario.estimatedRevenue}
                  </div>
                  <Badge variant={scenario.improvement > 30 ? "default" : "secondary"}>
                    +{scenario.improvement}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
