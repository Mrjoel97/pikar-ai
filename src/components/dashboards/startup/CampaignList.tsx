import React, { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Campaign {
  _id: string;
  subject: string;
  fromName?: string;
  fromEmail: string;
  status: string;
  audienceType?: string;
  recipients?: string[];
  scheduledAt?: number;
  createdAt?: number;
}

interface CampaignListProps {
  campaigns: Campaign[] | null | "skip";
  onCreateCampaign: () => void;
}

export function CampaignList({ campaigns, onCreateCampaign }: CampaignListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Email Campaigns
          <Button size="sm" onClick={onCreateCampaign}>
            Create Campaign
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        }>
          {!campaigns || campaigns === "skip" ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No campaigns yet. Create your first campaign to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.slice(0, 5).map((campaign) => (
                <Card key={campaign._id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium">{campaign.subject}</h3>
                        <p className="text-xs text-muted-foreground">
                          From: {campaign.fromName ? `${campaign.fromName} <${campaign.fromEmail}>` : campaign.fromEmail}
                        </p>
                      </div>
                      <Badge variant="outline">{campaign.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {(campaign.audienceType === "list" ? "Contact list" : `${(campaign.recipients?.length ?? 0)} recipients`)} • {(
                        campaign.scheduledAt
                          ? `Scheduled ${new Date(campaign.scheduledAt).toLocaleString?.()}`
                          : campaign.createdAt
                          ? `Created ${new Date(campaign.createdAt).toLocaleString?.()}`
                          : ""
                      )}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </Suspense>
      </CardContent>
    </Card>
  );
}
