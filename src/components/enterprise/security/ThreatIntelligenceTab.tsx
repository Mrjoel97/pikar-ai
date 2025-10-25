import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ThreatIntelligenceTabProps {
  threatIntel: any;
  getSeverityColor: (severity: string) => string;
  getThreatLevelColor: (level: string) => string;
}

export function ThreatIntelligenceTab({ threatIntel, getSeverityColor, getThreatLevelColor }: ThreatIntelligenceTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Threat Intelligence Overview</CardTitle>
        <CardDescription>
          Current threat level: <Badge variant="outline" className={getThreatLevelColor(threatIntel?.threatLevel || "low")}>
            {threatIntel?.threatLevel || "Low"}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-3">Active Threat Campaigns</h4>
            <div className="space-y-2">
              {threatIntel?.activeThreatCampaigns.map((campaign: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{campaign.campaignType.replace(/_/g, " ")}</div>
                    <div className="text-xs text-muted-foreground">
                      First seen: {new Date(campaign.firstSeen).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{campaign.detectionCount} detections</Badge>
                    <Badge variant="outline" className={getSeverityColor(campaign.severity)}>
                      {campaign.severity}
                    </Badge>
                  </div>
                </div>
              ))}
              {(!threatIntel?.activeThreatCampaigns || threatIntel.activeThreatCampaigns.length === 0) && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No active threat campaigns detected
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Recent Threat Indicators</h4>
            <div className="space-y-1">
              {threatIntel?.indicators.slice(0, 5).map((indicator: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 text-sm border-b">
                  <span>{indicator.type.replace(/_/g, " ")}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(indicator.timestamp).toLocaleTimeString()}
                    </span>
                    <Badge variant="outline" className={getSeverityColor(indicator.severity)}>
                      {indicator.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
