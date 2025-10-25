import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";

interface SecurityScoreCardProps {
  securityScore: any;
}

export function SecurityScoreCard({ securityScore }: SecurityScoreCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Score Breakdown</CardTitle>
        <CardDescription>
          Overall trend: <Badge variant="outline" className={
            securityScore?.trend === "improving" ? "bg-green-100 text-green-700" :
            securityScore?.trend === "declining" ? "bg-red-100 text-red-700" :
            "bg-blue-100 text-blue-700"
          }>
            {securityScore?.trend || "stable"}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {Object.entries(securityScore?.categoryScores || {}).map(([category, score]) => (
            <Card key={category}>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  {category.replace(/([A-Z])/g, " $1").trim()}
                </div>
                <div className="text-2xl font-bold">{score as number}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        {securityScore?.recommendations && securityScore.recommendations.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Recommendations</h4>
            <div className="space-y-2">
              {securityScore.recommendations.map((rec: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                  <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                  <span className="text-sm">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
