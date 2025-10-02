import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as React from "react";

interface RiskHeatmapProps {
  matrix: Record<string, Array<any>>;
  totalRisks: number;
  highRisks: number;
}

export function RiskHeatmap({ matrix, totalRisks, highRisks }: RiskHeatmapProps) {
  const [selectedCell, setSelectedCell] = React.useState<{ prob: number; impact: number } | null>(null);

  const getRiskLevel = (prob: number, impact: number): string => {
    const score = prob * impact;
    if (score >= 16) return "critical";
    if (score >= 12) return "high";
    if (score >= 6) return "medium";
    return "low";
  };

  const getCellColor = (prob: number, impact: number): string => {
    const level = getRiskLevel(prob, impact);
    switch (level) {
      case "critical": return "bg-red-600 hover:bg-red-700";
      case "high": return "bg-orange-500 hover:bg-orange-600";
      case "medium": return "bg-yellow-400 hover:bg-yellow-500";
      default: return "bg-green-400 hover:bg-green-500";
    }
  };

  const getCellRisks = (prob: number, impact: number) => {
    return matrix[`${prob}_${impact}`] || [];
  };

  const selectedRisks = selectedCell 
    ? getCellRisks(selectedCell.prob, selectedCell.impact)
    : [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Risk Heatmap</CardTitle>
          <CardDescription>
            {totalRisks} total risks • {highRisks} high-risk items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Y-axis label */}
            <div className="flex items-center gap-2 mb-2">
              <div className="text-xs font-medium text-muted-foreground w-16 text-right">Impact →</div>
            </div>
            
            {/* Grid (5x5) - reversed to show high impact at top */}
            {[5, 4, 3, 2, 1].map((impact) => (
              <div key={impact} className="flex items-center gap-2">
                <div className="text-xs font-medium text-muted-foreground w-16 text-right">
                  {impact === 5 ? "Very High" : impact === 4 ? "High" : impact === 3 ? "Medium" : impact === 2 ? "Low" : "Very Low"}
                </div>
                <div className="flex gap-2 flex-1">
                  {[1, 2, 3, 4, 5].map((prob) => {
                    const risks = getCellRisks(prob, impact);
                    const count = risks.length;
                    return (
                      <button
                        key={`${prob}_${impact}`}
                        onClick={() => setSelectedCell({ prob, impact })}
                        className={`flex-1 aspect-square rounded-md ${getCellColor(prob, impact)} text-white font-semibold text-sm flex items-center justify-center transition-colors cursor-pointer`}
                        title={`Probability: ${prob}, Impact: ${impact} - ${count} risk(s)`}
                      >
                        {count > 0 ? count : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {/* X-axis label */}
            <div className="flex items-center gap-2 mt-2">
              <div className="w-16" />
              <div className="flex gap-2 flex-1 text-xs text-muted-foreground">
                <div className="flex-1 text-center">Very Low</div>
                <div className="flex-1 text-center">Low</div>
                <div className="flex-1 text-center">Medium</div>
                <div className="flex-1 text-center">High</div>
                <div className="flex-1 text-center">Very High</div>
              </div>
            </div>
            <div className="text-center text-xs font-medium text-muted-foreground mt-1">
              ← Probability
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 justify-center flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-400" />
              <span className="text-xs">Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-400" />
              <span className="text-xs">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500" />
              <span className="text-xs">High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-600" />
              <span className="text-xs">Critical</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Details Dialog */}
      <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Risks: Probability {selectedCell?.prob} × Impact {selectedCell?.impact}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedRisks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No risks in this cell.</p>
            ) : (
              selectedRisks.map((risk: any) => (
                <Card key={risk._id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium">{risk.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{risk.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={risk.status === "open" ? "destructive" : "secondary"}>
                            {risk.status}
                          </Badge>
                          {risk.category && (
                            <Badge variant="outline">{risk.category}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Risk Score</div>
                        <div className="text-2xl font-bold">{risk.probability * risk.impact}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
