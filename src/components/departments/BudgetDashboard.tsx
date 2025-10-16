import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, TrendingUp, TrendingDown, DollarSign, AlertTriangle } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { toast } from "sonner";

interface BudgetDashboardProps {
  businessId?: Id<"businesses">;
  isGuest?: boolean;
}

export function BudgetDashboard({ businessId, isGuest }: BudgetDashboardProps) {
  const [selectedDept, setSelectedDept] = useState<string>("Marketing");
  const [forecastAmount, setForecastAmount] = useState<string>("");
  const [forecastReason, setForecastReason] = useState<string>("");
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);

  type BudgetDepartment = {
    department: string;
    allocated: number;
    spent: number;
    remaining: number;
    variance: number;
    forecast: number;
    alerts: string[];
  };

  type BudgetData = {
    fiscalYear: number;
    departments: BudgetDepartment[];
  };

  const budgetData = useQuery(
    api.departmentBudgets.getBudgetAllocations,
    businessId ? { businessId } : undefined
  ) as BudgetData | undefined;

  const trendData = useQuery(
    api.departmentBudgets.getBudgetTrend,
    businessId ? { businessId, department: selectedDept, months: 6 } : undefined
  );

  const adjustForecast = useMutation(api.departmentBudgets.adjustForecast);

  const handleAdjustForecast = async () => {
    if (!businessId || !forecastAmount) {
      toast.error("Please enter a forecast amount");
      return;
    }

    try {
      await adjustForecast({
        businessId,
        department: selectedDept,
        fiscalYear: budgetData?.fiscalYear || new Date().getFullYear(),
        newForecast: parseFloat(forecastAmount),
        reason: forecastReason || "Manual adjustment",
      });
      toast.success("Forecast adjusted successfully");
      setAdjustDialogOpen(false);
      setForecastAmount("");
      setForecastReason("");
    } catch (error) {
      toast.error("Failed to adjust forecast");
    }
  };

  if (!budgetData) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Provide a safe default to avoid undefined access during initial render
  const departments = (budgetData?.departments ?? []) as BudgetDepartment[];

  // Totals computed from safe array
  const totalAllocated = departments.reduce(
    (sum: number, d: BudgetDepartment) => sum + d.allocated,
    0
  );
  const totalSpent = departments.reduce(
    (sum: number, d: BudgetDepartment) => sum + d.spent,
    0
  );
  const totalRemaining = totalAllocated - totalSpent;
  const overallVariance = ((totalSpent - totalAllocated) / totalAllocated) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Department Budget Tracking</h2>
          <p className="text-muted-foreground">FY {budgetData.fiscalYear} Budget vs. Actual</p>
        </div>
        <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Adjust Forecast</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust Budget Forecast</DialogTitle>
              <DialogDescription>Update the forecast for {selectedDept}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Department</Label>
                <Select value={selectedDept} onValueChange={setSelectedDept}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept: BudgetDepartment) => (
                      <SelectItem key={dept.department} value={dept.department}>
                        {dept.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>New Forecast Amount ($)</Label>
                <Input
                  type="number"
                  value={forecastAmount}
                  onChange={(e) => setForecastAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <Label>Reason for Adjustment</Label>
                <Textarea
                  value={forecastReason}
                  onChange={(e) => setForecastReason(e.target.value)}
                  placeholder="Explain the reason for this adjustment..."
                  rows={3}
                />
              </div>
              <Button onClick={handleAdjustForecast} className="w-full">
                Save Forecast
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overall Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Allocated</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalAllocated / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">FY {budgetData.fiscalYear}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalSpent / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">
              {((totalSpent / totalAllocated) * 100).toFixed(1)}% of budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalRemaining / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">Available to spend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Variance</CardTitle>
            <AlertCircle className={`h-4 w-4 ${overallVariance > 0 ? "text-red-600" : "text-green-600"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overallVariance > 0 ? "text-red-600" : "text-green-600"}`}>
              {overallVariance > 0 ? "+" : ""}{overallVariance.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {overallVariance > 0 ? "Over budget" : "Under budget"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Alerts */}
      {departments.some((d: BudgetDepartment) => d.alerts.length > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertTriangle className="h-5 w-5" />
              Budget Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {departments.map((dept: BudgetDepartment) =>
                dept.alerts.map((alert: string, idx: number) => (
                  <div key={`${dept.department}-${idx}`} className="flex items-start gap-2 text-sm">
                    <span className="font-semibold text-orange-900">{dept.department}:</span>
                    <span className="text-orange-800">{alert}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Department Budget Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Budget vs. Actual by Department</CardTitle>
          <CardDescription>Allocated, spent, and forecast comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={departments}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="allocated" fill="#3b82f6" name="Allocated" />
              <Bar dataKey="spent" fill="#f59e0b" name="Spent" />
              <Bar dataKey="forecast" fill="#10b981" name="Forecast" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Trend: {selectedDept}</CardTitle>
          <CardDescription>Monthly spending vs. allocation</CardDescription>
          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept: BudgetDepartment) => (
                <SelectItem key={dept.department} value={dept.department}>
                  {dept.department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="allocated" stroke="#3b82f6" name="Allocated" strokeWidth={2} />
              <Line type="monotone" dataKey="spent" stroke="#f59e0b" name="Spent" strokeWidth={2} />
              <Line type="monotone" dataKey="forecast" stroke="#10b981" name="Forecast" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Department Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Department Budget Details</CardTitle>
          <CardDescription>Detailed breakdown by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Department</th>
                  <th className="text-right py-2 px-4">Allocated</th>
                  <th className="text-right py-2 px-4">Spent</th>
                  <th className="text-right py-2 px-4">Remaining</th>
                  <th className="text-right py-2 px-4">Variance</th>
                  <th className="text-right py-2 px-4">Forecast</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept: BudgetDepartment) => (
                  <tr key={dept.department} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-4 font-medium">{dept.department}</td>
                    <td className="text-right py-2 px-4">${dept.allocated.toLocaleString()}</td>
                    <td className="text-right py-2 px-4">${dept.spent.toLocaleString()}</td>
                    <td className="text-right py-2 px-4">
                      <span className={dept.remaining < 0 ? "text-red-600 font-semibold" : ""}>
                        ${dept.remaining.toLocaleString()}
                      </span>
                    </td>
                    <td className="text-right py-2 px-4">
                      <span className={`font-semibold ${dept.variance > 0 ? "text-red-600" : "text-green-600"}`}>
                        {dept.variance > 0 ? "+" : ""}{dept.variance.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right py-2 px-4">${dept.forecast.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}