import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Play } from "lucide-react";
import { useState } from "react";

interface JourneyStage {
  id: string;
  name: string;
  description?: string;
  order: number;
  color?: string;
}

interface JourneyBuilderProps {
  businessId: string;
  stages?: JourneyStage[];
  onSave?: (stages: JourneyStage[]) => void;
}

export function JourneyBuilder({ businessId, stages = [], onSave }: JourneyBuilderProps) {
  const [localStages, setLocalStages] = useState<JourneyStage[]>(stages);
  const [isEditing, setIsEditing] = useState(false);

  const defaultStages: JourneyStage[] = [
    { id: "awareness", name: "Awareness", order: 0, color: "#3b82f6" },
    { id: "consideration", name: "Consideration", order: 1, color: "#8b5cf6" },
    { id: "decision", name: "Decision", order: 2, color: "#f97316" },
    { id: "retention", name: "Retention", order: 3, color: "#10b981" },
    { id: "advocacy", name: "Advocacy", order: 4, color: "#ec4899" },
  ];

  const displayStages = localStages.length > 0 ? localStages : defaultStages;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Journey Builder</CardTitle>
            <CardDescription>Design your customer journey stages and transitions</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
              <Settings className="h-4 w-4 mr-2" />
              {isEditing ? "Done" : "Edit"}
            </Button>
            <Button size="sm" onClick={() => onSave?.(localStages)}>
              <Play className="h-4 w-4 mr-2" />
              Save Journey
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Visual Journey Flow */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4">
            {displayStages.map((stage, idx) => (
              <div key={stage.id} className="flex items-center gap-2">
                <div
                  className="rounded-lg p-4 min-w-[150px] text-center border-2"
                  style={{ borderColor: stage.color || "#3b82f6" }}
                >
                  <div className="font-semibold mb-1">{stage.name}</div>
                  {stage.description && (
                    <div className="text-xs text-muted-foreground">{stage.description}</div>
                  )}
                  <Badge variant="outline" className="mt-2">
                    Stage {stage.order + 1}
                  </Badge>
                </div>
                {idx < displayStages.length - 1 && (
                  <div className="text-2xl text-muted-foreground">→</div>
                )}
              </div>
            ))}
          </div>

          {isEditing && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="font-semibold mb-3">Stage Configuration</h4>
              <div className="space-y-2">
                {displayStages.map((stage) => (
                  <div key={stage.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: stage.color || "#3b82f6" }}
                      />
                      <span className="font-medium">{stage.name}</span>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stage
                </Button>
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            💡 Tip: Customize stages to match your business process. Add triggers and automations to move contacts automatically.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
