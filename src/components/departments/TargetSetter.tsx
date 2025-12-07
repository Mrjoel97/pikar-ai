import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Plus } from "lucide-react";
import { toast } from "sonner";

export function TargetSetter({ businessId, department, userId }: { businessId: string; department: string; userId: string }) {
  const [kpiName, setKpiName] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");
  const [timeframe, setTimeframe] = useState("monthly");
  const [alertThreshold, setAlertThreshold] = useState("10");

  const targets = useQuery(api.departmentKpis.targets.getDepartmentTargets, {
    businessId: businessId as any,
    department,
  });

  const setTarget = useMutation(api.departmentKpis.targets.setKpiTarget);

  const handleSetTarget = async () => {
    if (!kpiName || !targetValue || !unit) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await setTarget({
        businessId: businessId as any,
        department,
        kpiName,
        targetValue: parseFloat(targetValue),
        unit,
        timeframe,
        ownerId: userId as any,
        alertThreshold: parseFloat(alertThreshold),
      });
      toast.success("Target set successfully");
      setKpiName("");
      setTargetValue("");
      setUnit("");
    } catch (error) {
      toast.error("Failed to set target");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Set KPI Target</CardTitle>
          <CardDescription>Define performance targets for {department}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kpiName">KPI Name</Label>
            <Input
              id="kpiName"
              value={kpiName}
              onChange={(e) => setKpiName(e.target.value)}
              placeholder="e.g., Monthly Revenue"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetValue">Target Value</Label>
              <Input
                id="targetValue"
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="100000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="USD, %, units"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeframe">Timeframe</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger id="timeframe">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alertThreshold">Alert Threshold (%)</Label>
              <Input
                id="alertThreshold"
                type="number"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
                placeholder="10"
              />
            </div>
          </div>

          <Button onClick={handleSetTarget} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Set Target
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Targets ({targets?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {targets?.map((target: any) => (
              <div key={target._id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{target.kpiName}</p>
                  <p className="text-sm text-muted-foreground">{target.timeframe}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    {target.targetValue} {target.unit}
                  </p>
                  <p className="text-xs text-muted-foreground">±{target.alertThreshold}% alert</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
