import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface StageConfig {
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface JourneyStagesVisualizationProps {
  stageDistribution: Record<string, number>;
  averageDurations: Record<string, number>;
  totalContacts: number;
  stageConfig: Record<string, StageConfig>;
}

export function JourneyStagesVisualization({
  stageDistribution,
  averageDurations,
  totalContacts,
  stageConfig,
}: JourneyStagesVisualizationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Journey Stages</CardTitle>
        <CardDescription>Current distribution across customer journey</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-2">
          {Object.entries(stageConfig).map(([stage, config], idx) => {
            const count = stageDistribution[stage] || 0;
            const percentage = totalContacts !== 0 ? Math.round((count / totalContacts) * 100) : 0;
            const Icon = config.icon;

            return (
              <div key={stage} className="flex items-center gap-2">
                <div className="flex-1 text-center">
                  <div className={`${config.color} text-white rounded-lg p-4 mb-2`}>
                    <Icon className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs opacity-90">{percentage}%</div>
                  </div>
                  <div className="text-sm font-medium">{config.label}</div>
                  {averageDurations[stage] !== 0 && averageDurations[stage] && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Avg: {averageDurations[stage]}d
                    </div>
                  )}
                </div>
                
                {idx < Object.keys(stageConfig).length - 1 && (
                  <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
