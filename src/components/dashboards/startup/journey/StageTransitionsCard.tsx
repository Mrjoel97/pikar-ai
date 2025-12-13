import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

interface StageConfig {
  label: string;
  color: string;
}

interface StageTransitionsCardProps {
  transitionFlow: Record<string, Record<string, number>>;
  stageConfig: Record<string, StageConfig>;
}

export function StageTransitionsCard({ transitionFlow, stageConfig }: StageTransitionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stage Transitions</CardTitle>
        <CardDescription>Recent movement between stages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(transitionFlow).map(([fromStage, toStages]) => (
            <div key={fromStage} className="space-y-2">
              {Object.entries(toStages as Record<string, number>).map(([toStage, count]) => {
                const fromConfig = fromStage === "none" 
                  ? { label: "New", color: "bg-gray-500" }
                  : stageConfig[fromStage as keyof typeof stageConfig];
                const toConfig = stageConfig[toStage as keyof typeof stageConfig];

                return (
                  <div key={`${fromStage}-${toStage}`} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Badge className={fromConfig.color}>{fromConfig.label}</Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Badge className={toConfig.color}>{toConfig.label}</Badge>
                    <span className="ml-auto text-sm font-medium">{count} contacts</span>
                  </div>
                );
              })}
            </div>
          ))}
          
          {Object.keys(transitionFlow).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No transitions recorded yet. Stage transitions will appear here as contacts move through the journey.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
