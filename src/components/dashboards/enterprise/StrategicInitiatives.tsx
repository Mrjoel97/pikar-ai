import { Card, CardContent } from "@/components/ui/card";

interface StrategicInitiativesProps {
  workflows: Array<any>;
}

export function StrategicInitiatives({ workflows }: StrategicInitiativesProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Strategic Initiatives</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {workflows.slice(0, 6).map((workflow: any) => (
          <Card key={workflow.id}>
            <CardContent className="p-4">
              <h3 className="font-medium">{workflow.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Status: {workflow.status}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{ width: `${workflow.completionRate}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {workflow.completionRate}% complete
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
