import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Id } from "@/convex/_generated/dataModel";
import { Filter, Map, BarChart2, Link, Code } from "lucide-react";

interface TransformationEditorProps {
  businessId: Id<"businesses">;
}

export function TransformationEditor({ businessId }: TransformationEditorProps) {
  const transformationTypes = [
    {
      type: "filter",
      icon: Filter,
      name: "Filter",
      description: "Remove rows based on conditions",
      example: "WHERE status = 'active'",
    },
    {
      type: "map",
      icon: Map,
      name: "Map",
      description: "Transform column values",
      example: "UPPER(name), price * 1.1",
    },
    {
      type: "aggregate",
      icon: BarChart2,
      name: "Aggregate",
      description: "Group and summarize data",
      example: "SUM(revenue) GROUP BY category",
    },
    {
      type: "join",
      icon: Link,
      name: "Join",
      description: "Combine data from multiple sources",
      example: "LEFT JOIN customers ON id",
    },
    {
      type: "custom",
      icon: Code,
      name: "Custom",
      description: "Write custom transformation logic",
      example: "JavaScript/SQL function",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Transformation Library</h3>
        <p className="text-sm text-muted-foreground">
          Available transformation types for your ETL pipelines
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {transformationTypes.map((transform) => {
          const Icon = transform.icon;
          return (
            <Card key={transform.type} className="hover:border-primary cursor-pointer transition-colors">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{transform.name}</CardTitle>
                </div>
                <CardDescription>{transform.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {transform.type}
                  </Badge>
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono">
                    {transform.example}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transformation Editor</CardTitle>
          <CardDescription>
            Select a pipeline to edit its transformations
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12 text-muted-foreground">
          Select a pipeline from the Pipelines tab to configure transformations
        </CardContent>
      </Card>
    </div>
  );
}
