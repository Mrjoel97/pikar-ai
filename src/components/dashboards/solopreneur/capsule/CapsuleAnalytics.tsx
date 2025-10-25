import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CapsuleAnalyticsProps {
  analytics: any;
  engagement: any;
}

export function CapsuleAnalytics({ analytics, engagement }: CapsuleAnalyticsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Capsules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.totalCapsules || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Published</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {analytics?.published || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Scheduled</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analytics?.scheduled || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Drafts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {analytics?.drafts || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">30-Day Engagement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Impressions</div>
              <div className="text-xl font-bold">
                {engagement?.totalImpressions.toLocaleString() || 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Engagements</div>
              <div className="text-xl font-bold">
                {engagement?.totalEngagements.toLocaleString() || 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Engagement Rate</div>
              <div className="text-xl font-bold">
                {engagement?.avgEngagementRate.toFixed(2) || 0}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
