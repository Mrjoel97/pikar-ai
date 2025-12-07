import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface KpiTarget {
  _id: Id<"kpiTargets">;
  businessId: Id<"businesses">;
  department: string;
  name: string;
  targetValue: number;
  unit: string;
  timeframe: "monthly" | "quarterly" | "yearly";
  ownerId: Id<"users">;
  alertThreshold: number;
  status: "active" | "archived";
  createdAt: number;
  updatedAt: number;
}

export function TargetSetter({ businessId, department, userId }: { businessId: string; department: string; userId: string }) {
  const [kpiName, setKpiName] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");
  const [timeframe, setTimeframe] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [alertThreshold, setAlertThreshold] = useState("10");

  const targets = useQuery(api.departmentKpis.targets.getDepartmentTargets, {
    businessId: businessId as Id<"businesses">,
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
        businessId: businessId as Id<"businesses">,
        department,
        name: kpiName,
        targetValue: parseFloat(targetValue),
        unit,
        timeframe,
        ownerId: userId as Id<"users">,
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
              <Select value={timeframe} onValueChange={(v) => setTimeframe(v as "monthly" | "quarterly" | "yearly")}>
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
            {targets && targets.length > 0 ? (
              targets.map((target: KpiTarget) => (
                <div key={target._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{target.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{target.timeframe}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {target.targetValue.toLocaleString()} {target.unit}
                    </p>
                    <p className="text-xs text-muted-foreground">±{target.alertThreshold}% alert</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No targets set yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}