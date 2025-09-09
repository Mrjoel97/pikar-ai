import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

type StatCardProps = {
  title: string;
  value: number | string;
  description?: string;
  suffix?: string;
  icon: React.ComponentType<any>;
};

export function StatCard({ title, value, description, suffix, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {/* Normalize number + suffix spacing and hierarchy */}
        <div className="text-2xl font-bold leading-tight flex items-baseline gap-1">
          <span>{value}</span>
          {suffix && <span className="text-muted-foreground text-sm">{suffix}</span>}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}