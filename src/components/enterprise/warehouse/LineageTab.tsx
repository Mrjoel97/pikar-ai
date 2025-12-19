import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function LineageTab({ businessId }: { businessId: Id<"businesses"> }) {
  const dataLineage = useQuery(api.dataWarehouse.lineage.getLineageGraph, { businessId });

  if (!dataLineage) {
    return <div>Loading lineage...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Lineage</CardTitle>
        <CardDescription>Track data flow and transformations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-6 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium">Data Flow Visualization</div>
              <Button size="sm" variant="outline">
                <FileDown className="h-3 w-3 mr-1" />
                Export
              </Button>
            </div>
            <div className="space-y-3">
              {dataLineage.nodes.map((node: any, idx: number) => (
                <div key={node.id} className="flex items-center gap-3">
                  <div className={`w-32 p-2 rounded border text-center text-sm ${
                    node.type === "input" ? "bg-blue-50 border-blue-200" :
                    node.type === "output" ? "bg-green-50 border-green-200" :
                    "bg-gray-50 border-gray-200"
                  }`}>
                    {node.data.label}
                  </div>
                  {idx < dataLineage.nodes.length - 1 && (
                    <div className="flex-1 border-t-2 border-dashed border-gray-300" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
