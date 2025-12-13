import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, AlertTriangle, Users } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface CapacityPlannerProps {
  businessId: Id<"businesses">;
}

export function CapacityPlanner({ businessId }: CapacityPlannerProps) {
  const capacity = useQuery(api.resources.optimization.getCapacityPlanning, { businessId });
  const skillsGap = useQuery(api.resources.optimization.getSkillsGapAnalysis, { businessId });

  if (!capacity || !skillsGap) {
    return <div>Loading capacity planning data...</div>;
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="capacity" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="capacity">Capacity Planning</TabsTrigger>
          <TabsTrigger value="skills">Skills Gap Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="capacity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Capacity vs Demand Forecast</CardTitle>
              <CardDescription>6-month projection</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={capacity.capacityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="capacity" stroke="#10b981" name="Capacity" strokeWidth={2} />
                  <Line type="monotone" dataKey="demand" stroke="#ef4444" name="Demand" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {capacity.projectedShortfall > 0 && (
            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-base">Capacity Shortfall Detected</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Projected capacity shortfall in {capacity.projectedShortfall} of the next 6 months
                </p>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">💡 Recommendations</p>
                  <div className="space-y-2">
                    {capacity.recommendedHiring > 0 && (
                      <div className="flex items-center gap-2 text-sm text-blue-800">
                        <Users className="h-4 w-4" />
                        <span>Hire {capacity.recommendedHiring} additional team member{capacity.recommendedHiring > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {capacity.recommendations?.map((rec: any, i: number) => (
                      <div key={i} className="space-y-1">
                        <p className="text-sm font-medium text-blue-900">{rec.action}</p>
                        <div className="grid grid-cols-3 gap-2 text-xs text-blue-800">
                          <div>
                            <span className="text-muted-foreground">Cost:</span> ${(rec.cost / 1000).toFixed(0)}K
                          </div>
                          <div>
                            <span className="text-muted-foreground">Impact:</span> {rec.impact}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Timeline:</span> {rec.timeline}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Skills Gap Analysis</CardTitle>
              <CardDescription>Current vs required skill levels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {skillsGap.gaps.map((gap: any, index: number) => (
                <Card key={index} className={gap.gap >= 2 ? "border-l-4 border-l-red-500" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{gap.skill}</CardTitle>
                      <Badge variant={gap.gap >= 2 ? "destructive" : "secondary"}>
                        Gap: {gap.gap} levels
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Current Level</p>
                        <p className="font-semibold">{gap.currentLevel}/10</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Required Level</p>
                        <p className="font-semibold">{gap.requiredLevel}/10</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Team Members</p>
                        <p className="font-semibold">{gap.teamMembers}</p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Skill Level Progress</span>
                        <span>{gap.currentLevel}/10</span>
                      </div>
                      <Progress value={(gap.currentLevel / 10) * 100} />
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <strong>Recommendation:</strong> {gap.recommendation}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {skillsGap.criticalGaps.length > 0 && (
                <Card className="bg-red-50 border-red-200">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <CardTitle className="text-base text-red-900">Critical Skills Gaps</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-red-800">
                      {skillsGap.criticalGaps.length} critical skill gap{skillsGap.criticalGaps.length > 1 ? 's' : ''} detected. 
                      Immediate action recommended to prevent project delays.
                    </p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
