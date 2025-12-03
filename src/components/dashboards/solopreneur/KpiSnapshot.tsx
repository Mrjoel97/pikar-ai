import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface KpiMetric {
  value: number;
  delta: number;
}

interface KpiSnapshotProps {
  snapshot: {
    revenue: KpiMetric;
    subscribers: KpiMetric;
    engagement: KpiMetric;
    taskCompletion: KpiMetric;
  };
}

const TrendIndicator = ({ delta }: { delta: number }) => {
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
        <ArrowUp className="h-3 w-3" />
        +{delta.toLocaleString(undefined, { maximumFractionDigits: 0 })}% WoW
      </span>
    );
  } else if (delta < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-600">
        <ArrowDown className="h-3 w-3" />
        {delta.toLocaleString(undefined, { maximumFractionDigits: 0 })}% WoW
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
        <Minus className="h-3 w-3" />
        0% WoW
      </span>
    );
  }
};

export function KpiSnapshot({ snapshot }: KpiSnapshotProps) {
  const fmtNum = (n: number, digits = 0) => {
    return n.toLocaleString(undefined, { maximumFractionDigits: digits });
  };

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">KPI Snapshot</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Revenue
            </h3>
            <p className="text-2xl font-bold">
              ${fmtNum(snapshot.revenue.value)}
            </p>
            <div className="mt-1">
              <TrendIndicator delta={snapshot.revenue.delta} />
            </div>
            <Progress
              value={Math.min(100, (snapshot.revenue.value / 20000) * 100)}
              className="mt-2"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Subscribers
            </h3>
            <p className="text-2xl font-bold">
              {fmtNum(snapshot.subscribers.value)}
            </p>
            <div className="mt-1">
              <TrendIndicator delta={snapshot.subscribers.delta} />
            </div>
            <Progress
              value={Math.min(100, (snapshot.subscribers.value / 1000) * 100)}
              className="mt-2"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Engagement
            </h3>
            <p className="text-2xl font-bold">
              {fmtNum(snapshot.engagement.value)}%
            </p>
            <div className="mt-1">
              <TrendIndicator delta={snapshot.engagement.delta} />
            </div>
            <Progress
              value={Math.min(100, snapshot.engagement.value)}
              className="mt-2"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Task Completion
            </h3>
            <p className="text-2xl font-bold">
              {fmtNum(snapshot.taskCompletion.value)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Across current workflows
            </p>
            <Progress
              value={Math.min(100, snapshot.taskCompletion.value)}
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
