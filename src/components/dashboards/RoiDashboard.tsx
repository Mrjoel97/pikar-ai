import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Clock, DollarSign, Target, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface RoiDashboardProps {
  businessId: string;
  userId: string;
}

export function RoiDashboard({ businessId, userId }: RoiDashboardProps) {
  const [period, setPeriod] = useState<30 | 60 | 90>(30);
  const [showSettings, setShowSettings] = useState(false);
  const [hourlyRateInput, setHourlyRateInput] = useState("");

  const roiData = useQuery(
    api.roiCalculations.calculateTimeSavedROI,
    businessId && userId ? { businessId: businessId as any, userId: userId as any, days: period } : "skip"
  );

  const updateHourlyRate = useMutation(api.roiCalculations.updateHourlyRate);

  const handleUpdateHourlyRate = async () => {
    const rate = parseFloat(hourlyRateInput);
    if (isNaN(rate) || rate <= 0) {
      toast.error("Please enter a valid hourly rate");
      return;
    }

    try {
      await updateHourlyRate({
        businessId: businessId as any,
        userId: userId as any,
        hourlyRate: rate,
      });
      toast.success("Hourly rate updated successfully");
      setShowSettings(false);
      setHourlyRateInput("");
    } catch (error) {
      toast.error("Failed to update hourly rate");
    }
  };

  if (!roiData) {
    return (
      <Card className="neu-raised">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            ROI Dashboard
          </CardTitle>
          <CardDescription>Loading ROI metrics...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const roiColor = roiData.roiPercentage >= 100 ? "text-green-600" : roiData.roiPercentage >= 50 ? "text-yellow-600" : "text-orange-600";

  return (
    <Card className="neu-raised">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              ROI Dashboard
            </CardTitle>
            <CardDescription>Time saved converted to revenue impact</CardDescription>
          </div>
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ROI Settings</DialogTitle>
                <DialogDescription>Configure your hourly rate for ROI calculations</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Your Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    placeholder={`Current: $${roiData.hourlyRate}/hr`}
                    value={hourlyRateInput}
                    onChange={(e) => setHourlyRateInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This rate is used to calculate the monetary value of time saved
                  </p>
                </div>
                <Button onClick={handleUpdateHourlyRate} className="w-full">
                  Update Rate
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Period Selector */}
        <div className="flex gap-2">
          {[30, 60, 90].map((days) => (
            <Button
              key={days}
              variant={period === days ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(days as 30 | 60 | 90)}
            >
              {days} Days
            </Button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Time Saved
            </div>
            <div className="text-2xl font-bold">{roiData.timeSavedHours}h</div>
            <div className="text-xs text-muted-foreground">{roiData.timeSavedMinutes} minutes</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Estimated Value
            </div>
            <div className="text-2xl font-bold">${roiData.estimatedRevenue.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">@ ${roiData.hourlyRate}/hr</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              Actual Revenue
            </div>
            <div className="text-2xl font-bold">${roiData.actualRevenue.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Tracked revenue</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              ROI
            </div>
            <div className={`text-2xl font-bold ${roiColor}`}>{roiData.roiPercentage}%</div>
            <Badge variant={roiData.roiPercentage >= 100 ? "default" : "secondary"} className="text-xs">
              {roiData.roiPercentage >= 100 ? "Exceeding" : "Growing"}
            </Badge>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={roiData.dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="timeSaved"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Time Saved (min)"
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                name="Revenue ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
          <h4 className="font-semibold text-sm">💡 Insights</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            {roiData.timeSavedHours > 0 && (
              <li>• You've saved {roiData.timeSavedHours} hours in the last {period} days</li>
            )}
            {roiData.roiPercentage >= 100 && (
              <li>• Your actual revenue exceeds estimated value - great job!</li>
            )}
            {roiData.roiPercentage < 50 && (
              <li>• Consider tracking more revenue events to see full ROI impact</li>
            )}
            {roiData.estimatedRevenue > 0 && (
              <li>• Time saved is worth ${roiData.estimatedRevenue} at your current rate</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
