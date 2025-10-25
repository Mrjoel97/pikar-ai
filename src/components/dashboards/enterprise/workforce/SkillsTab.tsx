import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface SkillsTabProps {
  advancedSkillGaps: any;
}

export function SkillsTab({ advancedSkillGaps }: SkillsTabProps) {
  if (!advancedSkillGaps) {
    return <div className="text-sm text-muted-foreground">Loading skill gap data...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Critical Skill Gaps</CardTitle>
          <CardDescription>Skills requiring immediate attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {advancedSkillGaps.criticalGaps?.map((gap: any) => (
              <div key={gap.skill} className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{gap.skill}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={
                      gap.urgency === "critical" ? "bg-red-100 text-red-700" :
                      gap.urgency === "high" ? "bg-orange-100 text-orange-700" :
                      "bg-yellow-100 text-yellow-700"
                    }>
                      {gap.urgency}
                    </Badge>
                    <Badge variant="outline">Gap: {gap.gap}%</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>Current: {gap.employeesWithSkill} employees ({gap.currentLevel}%)</div>
                  <div>Target: {gap.employeesNeeded} employees ({gap.targetLevel}%)</div>
                </div>
                <Progress value={gap.currentLevel} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Emerging Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Emerging Skills</CardTitle>
          <CardDescription>High-demand skills with growth potential</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={advancedSkillGaps.emergingSkills || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="skill" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="demand" fill="#10b981" name="Market Demand" />
              <Bar dataKey="currentCoverage" fill="#3b82f6" name="Current Coverage" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Training Programs */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Training Programs</CardTitle>
          <CardDescription>Structured programs to close skill gaps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {advancedSkillGaps.trainingPrograms?.map((program: any, idx: number) => (
              <div key={idx} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium">{program.programName}</div>
                    <div className="text-xs text-muted-foreground">{program.provider}</div>
                  </div>
                  <Badge variant="outline">${program.cost.toLocaleString()}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>Duration: {program.duration}</div>
                  <div>Capacity: {program.capacity} people</div>
                  <div>Improvement: +{program.expectedImprovement}%</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hiring Needs */}
      <Card>
        <CardHeader>
          <CardTitle>Strategic Hiring Needs</CardTitle>
          <CardDescription>Positions to fill critical gaps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {advancedSkillGaps.hiringNeeds?.map((need: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{need.skill}</div>
                  <div className="text-xs text-muted-foreground">
                    {need.positions} positions • {need.timeToFill}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className={
                    need.priority === "critical" ? "bg-red-100 text-red-700" :
                    "bg-orange-100 text-orange-700"
                  }>
                    {need.priority}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    ${need.estimatedCost.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
