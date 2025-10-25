import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Clock, RefreshCw, AlertTriangle } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface KeyRotationSchedulerProps {
  businessId: Id<"businesses">;
}

export function KeyRotationScheduler({ businessId }: KeyRotationSchedulerProps) {
  const configs = useQuery(api.kms.getKmsConfig, { businessId });
  const rotations = useQuery(api.kms.getKeyRotationSchedule, { businessId });
  const scheduleRotation = useMutation(api.kms.scheduleKeyRotation);

  const [selectedConfig, setSelectedConfig] = useState<Id<"kmsConfigs"> | null>(null);
  const [intervalDays, setIntervalDays] = useState(90);
  const [autoRotate, setAutoRotate] = useState(true);
  const [scheduling, setScheduling] = useState(false);

  const handleSchedule = async () => {
    if (!selectedConfig) {
      toast.error("Please select a KMS configuration");
      return;
    }

    setScheduling(true);
    try {
      await scheduleRotation({
        businessId,
        configId: selectedConfig,
        rotationIntervalDays: intervalDays,
        autoRotate,
      });
      toast.success("Key rotation scheduled successfully");
      setSelectedConfig(null);
      setIntervalDays(90);
    } catch (error: any) {
      toast.error(error.message || "Failed to schedule rotation");
    } finally {
      setScheduling(false);
    }
  };

  const activeConfigs = configs?.filter((c) => c.active) || [];
  const now = Date.now();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Schedule Key Rotation
          </CardTitle>
          <CardDescription>
            Automatically rotate encryption keys to maintain security compliance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select KMS Configuration</Label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedConfig || ""}
              onChange={(e) => setSelectedConfig(e.target.value as Id<"kmsConfigs">)}
            >
              <option value="">Choose a configuration...</option>
              {activeConfigs.map((config) => (
                <option key={config._id} value={config._id}>
                  {config.provider.toUpperCase()} - {config.keyId}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interval">Rotation Interval (days)</Label>
            <Input
              id="interval"
              type="number"
              min={30}
              max={365}
              value={intervalDays}
              onChange={(e) => setIntervalDays(parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 90 days for compliance
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="auto-rotate">Enable Automatic Rotation</Label>
            <Switch
              id="auto-rotate"
              checked={autoRotate}
              onCheckedChange={setAutoRotate}
            />
          </div>

          <Button onClick={handleSchedule} disabled={scheduling || !selectedConfig} className="w-full">
            {scheduling ? "Scheduling..." : "Schedule Rotation"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scheduled Rotations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!rotations || rotations.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No rotations scheduled
            </p>
          ) : (
            <div className="space-y-3">
              {rotations.map((rotation) => {
                const config = configs?.find((c) => c._id === rotation.configId);
                const isOverdue = rotation.nextRotationDate < now;
                const daysUntil = Math.ceil(
                  (rotation.nextRotationDate - now) / (24 * 60 * 60 * 1000)
                );

                return (
                  <div
                    key={rotation._id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {config?.provider.toUpperCase()} - {config?.keyId}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3" />
                        Every {rotation.rotationIntervalDays} days
                      </div>
                    </div>
                    <div className="text-right">
                      {isOverdue ? (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Overdue
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          {daysUntil} days
                        </Badge>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(rotation.nextRotationDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
