import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface RevenueAttributionTableProps {
  attribution: {
    totalRevenue: number;
    totalConversions: number;
    campaigns: Array<{
      campaignId: string;
      campaignName: string;
      revenue: number;
      conversions: number;
      avgOrderValue: number;
    }>;
  };
}

export function RevenueAttributionTable({ attribution }: RevenueAttributionTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Attribution</CardTitle>
        <CardDescription>
          Total Revenue: ${attribution.totalRevenue.toFixed(2)} | Conversions: {attribution.totalConversions}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Conversions</TableHead>
              <TableHead className="text-right">Avg Order Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attribution.campaigns.map((campaign) => (
              <TableRow key={campaign.campaignId}>
                <TableCell className="font-medium">{campaign.campaignName}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline">${campaign.revenue.toFixed(2)}</Badge>
                </TableCell>
                <TableCell className="text-right">{campaign.conversions}</TableCell>
                <TableCell className="text-right">${campaign.avgOrderValue.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
