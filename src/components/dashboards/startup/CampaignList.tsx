import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail } from "lucide-react";

interface CampaignListProps {
  campaigns: any;
  onCreateCampaign: () => void;
}

export function CampaignList({ campaigns, onCreateCampaign }: CampaignListProps) {
  const campaignList = campaigns !== "skip" && Array.isArray(campaigns) ? campaigns : [];

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Email Campaigns</h2>
        <Button onClick={onCreateCampaign}>
          <Mail className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>
      
      {campaignList.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">No campaigns yet. Create your first campaign to get started.</p>
            <Button onClick={onCreateCampaign}>Create First Campaign</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaignList.slice(0, 6).map((campaign: any) => (
            <Card key={campaign._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{campaign.subject}</CardTitle>
                  <Badge variant={campaign.status === "sent" ? "default" : "secondary"}>
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recipients:</span>
                    <span className="font-medium">{campaign.recipientCount || 0}</span>
                  </div>
                  {campaign.scheduledFor && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Scheduled:</span>
                      <span className="font-medium">
                        {new Date(campaign.scheduledFor).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}