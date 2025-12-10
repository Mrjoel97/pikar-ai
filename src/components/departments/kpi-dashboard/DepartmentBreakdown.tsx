import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface DepartmentBreakdownProps {
  department: string;
  data: any;
}

export function DepartmentBreakdown({ department, data }: DepartmentBreakdownProps) {
  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Marketing Breakdown */}
      {department === "Marketing" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>ROI by Channel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.roiByChannel}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="roi" fill="#10b981" name="ROI" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.topCampaigns?.map((campaign: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {campaign.conversions} conversions
                      </div>
                    </div>
                    <Badge variant="outline">{campaign.roi.toFixed(1)}x ROI</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Sales Breakdown */}
      {department === "Sales" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Pipeline by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.pipelineByStage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" name="Value ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Sales Reps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.topReps?.map((rep: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{rep.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ${rep.achieved.toLocaleString()} / ${rep.quota.toLocaleString()}
                      </div>
                    </div>
                    <Badge variant={rep.attainment >= 90 ? "default" : "secondary"}>
                      {rep.attainment}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Operations Breakdown */}
      {department === "Operations" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Throughput by Team</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.throughputByTeam}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="team" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="throughput" fill="#8b5cf6" name="Throughput" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bottleneck Processes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.bottleneckProcesses?.map((process: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{process.process}</div>
                      <div className="text-sm text-muted-foreground">
                        Avg time: {process.avgTime} days
                      </div>
                    </div>
                    <Badge variant={process.impact === "High" ? "destructive" : "secondary"}>
                      {process.impact}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Finance Breakdown */}
      {department === "Finance" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Department Spending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.departmentSpending?.map((dept: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{dept.department}</span>
                      <span className="text-muted-foreground">
                        ${dept.spend.toLocaleString()} / ${dept.budget.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          dept.variance < -20 ? "bg-red-500" : "bg-green-500"
                        }`}
                        style={{ width: `${(dept.spend / dept.budget) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AR/AP Aging</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.arApAging}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bucket" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="ar" fill="#10b981" name="AR" />
                    <Bar dataKey="ap" fill="#ef4444" name="AP" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
