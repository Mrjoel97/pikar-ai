import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Target, TrendingUp } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface TargetSetterProps {
  businessId: Id<"businesses">;
  department: string;
  userId: Id<"users">;
}

export function TargetSetter({ businessId, department, userId }: TargetSetterProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");
  const [timeframe, setTimeframe] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [alertThreshold, setAlertThreshold] = useState("10");

  const setTarget = useMutation(api.departmentKpis.targets.setTarget);
  const targets = useQuery(api.departmentKpis.targets.getTargets, {
    businessId,
    department,
    status: "active",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !targetValue || !unit) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await setTarget({
        businessId,
        department,
        name,
        targetValue: parseFloat(targetValue),
        unit,
        timeframe,
        ownerId: userId,
        alertThreshold: parseFloat(alertThreshold),
      });

      toast.success("Target set successfully");
      setOpen(false);
      setName("");
      setTargetValue("");
      setUnit("");
      setAlertThreshold("10");
    } catch (error) {
      toast.error("Failed to set target");
      console.error(error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Performance Targets</h3>
          <p className="text-sm text-muted-foreground">
            Set and track department goals
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Target
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set New Target</DialogTitle>
              <DialogDescription>
                Define a performance target for {department}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">KPI Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Monthly Revenue"
                  required
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
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="USD"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeframe">Timeframe</Label>
                <Select value={timeframe} onValueChange={(v: any) => setTimeframe(v)}>
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
                  min="0"
                  max="100"
                />
                <p className="text-xs text-muted-foreground">
                  Alert when deviation exceeds this percentage
                </p>
              </div>
              <Button type="submit" className="w-full">
                Set Target
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {targets?.map((target) => (
          <Card key={target._id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{target.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {target.timeframe} target
                  </CardDescription>
                </div>
                <Badge variant="outline" className="gap-1">
                  <Target className="h-3 w-3" />
                  {target.targetValue} {target.unit}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Alert threshold: {target.alertThreshold}%
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {targets?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No targets set yet. Create your first target to start tracking.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}