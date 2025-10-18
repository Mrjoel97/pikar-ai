import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { ReactNode, Dispatch, SetStateAction } from "react";

interface WidgetGridProps {
  widgetOrder?: Array<string>;
  setWidgetOrder?: Dispatch<SetStateAction<Array<string>>>;
  widgetsByKey?: Record<string, { key: string; title: string; content: ReactNode }>;
  onUpgrade?: () => void;
  // Add: direct widgets support for simpler usage
  widgets?: Array<{ id: string; title: string; value: ReactNode }>;
}

export function WidgetGrid({
  widgetOrder,
  setWidgetOrder,
  widgetsByKey,
  widgets = [],
  onUpgrade,
}: WidgetGridProps) {
  // Build ordered items from keys + map if provided, otherwise use direct widgets array
  const items: Array<{ id: string; title: string; value: ReactNode }> =
    widgetsByKey && Array.isArray(widgetOrder)
      ? widgetOrder.map((key) => {
          const w = widgetsByKey[key];
          return {
            id: key,
            title: w?.title ?? key,
            value: w?.content ?? null,
          };
        })
      : widgets;

  if (!items || items.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-sm text-muted-foreground">No widgets configured</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map((widget) => (
        <Card key={widget.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{widget.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{widget.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}