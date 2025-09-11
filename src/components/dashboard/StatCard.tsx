import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

type StatCardProps = {
  title: string;
  value: number | string;
  description?: string;
  suffix?: string;
  icon?: React.ComponentType<any>;
  prefix?: string;
  delta?: number;
};

export function StatCard({
  title,
  value,
  description,
  suffix,
  icon: Icon,
  prefix,
  delta,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold leading-tight flex items-baseline gap-1">
          {prefix && <span className="text-muted-foreground text-sm">{prefix}</span>}
          <span>{value}</span>
          {suffix && <span className="text-muted-foreground text-sm">{suffix}</span>}
        </div>
        {typeof delta === "number" && (
          <div
            className={`text-xs mt-1 ${
              delta >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {delta >= 0 ? "+" : ""}
            {delta}%
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}