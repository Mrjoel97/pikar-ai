import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RiskAssessmentTabProps {
  riskAssessment: any;
  getRiskColor: (level: string) => string;
}

export default function RiskAssessmentTab({ riskAssessment, getRiskColor }: RiskAssessmentTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Risk Assessment</CardTitle>
        <CardDescription>
          Overall risk level: <Badge variant="outline" className={getRiskColor(riskAssessment?.riskLevel || "low")}>
            {riskAssessment?.riskLevel || "Low"}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {riskAssessment?.risks.map((risk: any) => (
            <div key={risk._id} className="p-3 border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-medium">{risk.riskType}</div>
                  <div className="text-xs text-muted-foreground">{risk.initiativeName}</div>
                </div>
                <Badge variant="outline" className={getRiskColor(risk.status)}>
                  Impact: {risk.impact} | Probability: {risk.probability}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">{risk.description}</div>
            </div>
          ))}
          {(!riskAssessment?.risks || riskAssessment.risks.length === 0) && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No active risks identified
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
