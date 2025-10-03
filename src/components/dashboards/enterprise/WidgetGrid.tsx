import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import React from "react";

type Widget = { key: string; title: string; content: React.ReactNode };
type Props = {
  hasEnterprise: boolean;
  widgetOrder: string[];
  setWidgetOrder: (keys: string[]) => void;
  widgetsByKey: Record<string, Widget>;
  onUpgrade: () => void;
};

export function WidgetGrid({ hasEnterprise, widgetOrder, setWidgetOrder, widgetsByKey, onUpgrade }: Props) {
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, key: string) => {
    e.dataTransfer.setData("text/widget", key);
  };
  const onDropCard = (e: React.DragEvent<HTMLDivElement>, targetKey: string) => {
    const sourceKey = e.dataTransfer.getData("text/widget");
    if (!sourceKey || sourceKey === targetKey) return;
    const order = [...widgetOrder];
    const from = order.indexOf(sourceKey);
    const to = order.indexOf(targetKey);
    if (from === -1 || to === -1) return;
    order.splice(from, 1);
    order.splice(to, 0, sourceKey);
    setWidgetOrder(order);
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const LockedRibbon = ({ label = "Enterprise feature" }: { label?: string }) => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Badge variant="outline" className="border-amber-300 text-amber-700">Locked</Badge>
      <span>{label}</span>
      <Button size="sm" variant="outline" onClick={onUpgrade} className="ml-auto">Upgrade</Button>
    </div>
  );

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Command Widgets</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="font-medium mb-2">Global Operations</h3>
            <Button className="w-full">Manage</Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="font-medium mb-2">Crisis Management</h3>
            <Button variant="outline" className="w-full">Standby</Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="font-medium mb-2">Innovation Hub</h3>
            <Button className="w-full">Explore</Button>
          </CardContent>
        </Card>
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-4 text-center">
            <h3 className="font-medium mb-2">Custom Widget</h3>
            <p className="text-xs text-muted-foreground mb-2">Drag & drop available</p>
            <Button variant="outline" size="sm">Customize</Button>
            {!hasEnterprise && (
              <div className="mt-3">
                <LockedRibbon label="Custom widget grid is Enterprise+" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold my-4">Custom Widget Grid</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {widgetOrder.map((key) => {
          const w = widgetsByKey[key];
          if (!w) return null;
          return (
            <Card
              key={w.key}
              draggable
              onDragStart={(e) => onDragStart(e, w.key)}
              onDragOver={onDragOver}
              onDrop={(e) => onDropCard(e, w.key)}
              className="border-dashed"
              title="Drag to reorder"
            >
              <CardHeader className="pb-2">
                <CardTitle>{w.title}</CardTitle>
              </CardHeader>
              <CardContent>{w.content}</CardContent>
            </Card>
          );
        })}
      </div>
      {!hasEnterprise && (
        <div className="pt-2">
          <div className="rounded-md border p-2 mt-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="border-amber-300 text-amber-700">Locked</Badge>
              <span>Drag-and-drop persistence is Enterprise+</span>
              <Button size="sm" variant="outline" onClick={onUpgrade} className="ml-auto">Upgrade</Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
