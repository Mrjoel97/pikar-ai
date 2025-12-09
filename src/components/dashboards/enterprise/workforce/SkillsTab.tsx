import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingDown, Award } from "lucide-react";

interface SkillsTabProps {
  advancedSkillGaps: any;
}

export function SkillsTab({ advancedSkillGaps }: SkillsTabProps) {
  if (!advancedSkillGaps) {
    return <div className="text-sm text-muted-foreground">Loading skill gap analysis...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Gaps</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{advancedSkillGaps.criticalGaps?.length || 0}</div>
            <p className="text-xs text-red-600">Immediate training needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skills Tracked</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{advancedSkillGaps.totalSkills || 0}</div>
            <p className="text-xs text-muted-foreground">Across all departments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training ROI</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{advancedSkillGaps.trainingRoi || 0}%</div>
            <p className="text-xs text-green-600">Expected productivity gain</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Critical Skill Gaps</CardTitle>
          <CardDescription>Skills requiring immediate attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {advancedSkillGaps.criticalGaps?.map((gap: any) => (
              <div key={gap.skill} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{gap.skill}</span>
                    <Badge variant="destructive">Gap: {gap.gap}%</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Target: {gap.targetLevel}%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Current Level</span>
                    <span>{gap.currentLevel}%</span>
                  </div>
                  <Progress value={gap.currentLevel} className="h-2" />
                </div>
                <div className="text-xs text-muted-foreground">
                  Recommended: {gap.recommendedTraining}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skill Distribution</CardTitle>
          <CardDescription>Current skill proficiency across teams</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {advancedSkillGaps.skillDistribution?.map((skill: any) => (
              <div key={skill.skill} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{skill.skill}</span>
                    <Badge variant="outline">{skill.employees} employees</Badge>
                  </div>
                  <Progress value={skill.proficiency} className="h-2" />
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm font-medium">{skill.proficiency}%</div>
                  <div className="text-xs text-muted-foreground">proficiency</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}