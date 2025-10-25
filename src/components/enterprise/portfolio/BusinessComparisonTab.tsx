import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface BusinessComparisonTabProps {
  crossBusinessAnalytics: any;
}

export function BusinessComparisonTab({ crossBusinessAnalytics }: BusinessComparisonTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cross-Business Analytics</CardTitle>
        <CardDescription>Compare performance across all business units</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Initiatives</div>
              <div className="text-2xl font-bold">{crossBusinessAnalytics?.totalInitiatives || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Avg Completion Rate</div>
              <div className="text-2xl font-bold">{crossBusinessAnalytics?.avgCompletionRate || 0}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Business Units</div>
              <div className="text-2xl font-bold">{crossBusinessAnalytics?.businesses.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={crossBusinessAnalytics?.businesses || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="businessName" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="completionRate" fill="#10b981" name="Completion Rate %" />
            <Bar dataKey="activeInitiatives" fill="#3b82f6" name="Active Initiatives" />
          </BarChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Top Performers
            </h4>
            <div className="space-y-2">
              {crossBusinessAnalytics?.topPerformers.map((business: any) => (
                <div key={business.businessId} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{business.businessName}</span>
                  <Badge variant="outline" className="bg-green-100 text-green-700">
                    {Math.round(business.completionRate)}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Needs Attention
            </h4>
            <div className="space-y-2">
              {crossBusinessAnalytics?.underperformers.map((business: any) => (
                <div key={business.businessId} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{business.businessName}</span>
                  <Badge variant="outline" className="bg-orange-100 text-orange-700">
                    {Math.round(business.completionRate)}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
