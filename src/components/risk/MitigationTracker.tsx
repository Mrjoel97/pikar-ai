import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Shield, TrendingDown, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function MitigationTracker({ businessId }: { businessId: string }) {
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [strategy, setStrategy] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const scenarios = useQuery(api.risk.scenarios.listScenarios, { businessId: businessId as any });
  const metrics = useQuery(api.risk.mitigation.getMitigationMetrics, { businessId: businessId as any });
  const addMitigation = useMutation(api.risk.mitigation.addMitigation);

  const activeRisks = scenarios?.filter((s: any) => s.status !== "closed" && s.status !== "mitigated") || [];

  const handleAddMitigation = async () => {
    if (!selectedRisk || !strategy || !targetDate) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await addMitigation({
        riskId: selectedRisk as any,
        strategy,
        owner: businessId as any, // Placeholder
        targetDate: new Date(targetDate).getTime(),
        expectedReduction: 50,
      });
      toast.success("Mitigation strategy added");
      setStrategy("");
      setTargetDate("");
      setSelectedRisk(null);
    } catch (error) {
      toast.error("Failed to add mitigation");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalRisks || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics?.activeRisks || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Mitigated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics?.mitigatedRisks || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Mitigation Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.mitigationRate.toFixed(1) || 0}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Mitigation Strategy</CardTitle>
          <CardDescription>Define how to reduce or eliminate risks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="risk">Select Risk</Label>
            <select
              id="risk"
              className="w-full p-2 border rounded-md"
              value={selectedRisk || ""}
              onChange={(e) => setSelectedRisk(e.target.value)}
            >
              <option value="">Choose a risk...</option>
              {activeRisks.map((risk: any) => (
                <option key={risk._id} value={risk._id}>
                  {risk.title} (Score: {risk.riskScore})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategy">Mitigation Strategy</Label>
            <Textarea
              id="strategy"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              placeholder="Describe the mitigation approach..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetDate">Target Completion Date</Label>
            <Input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          <Button onClick={handleAddMitigation} className="w-full">
            <Shield className="mr-2 h-4 w-4" />
            Add Mitigation Strategy
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mitigation Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scenarios?.filter((s: any) => s.mitigation).map((risk: any) => (
              <div key={risk._id} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{risk.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{risk.mitigation}</p>
                  </div>
                  <Badge variant={risk.status === "mitigated" ? "default" : "secondary"}>
                    {risk.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Risk Reduction</span>
                    <span className="font-medium">
                      {((1 - risk.riskScore / 25) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={(1 - risk.riskScore / 25) * 100} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
