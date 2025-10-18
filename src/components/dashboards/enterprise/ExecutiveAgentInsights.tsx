import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ExecutiveAgentInsightsProps {
  entAgents: Array<any>;
  onNavigate: (path: string) => void;
}

export function ExecutiveAgentInsights({ entAgents, onNavigate }: ExecutiveAgentInsightsProps) {
  if (!Array.isArray(entAgents) || entAgents.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {entAgents.map(a => (
          <Button
            key={a.agent_key}
            variant="secondary"
            className="justify-start"
            onClick={() => onNavigate(`/agents?agent=${encodeURIComponent(a.agent_key)}`)}
            title={a.short_desc}
          >
            {a.display_name}
          </Button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {entAgents.map(a => (
          <Button
            key={`tg-${a.agent_key}`}
            size="sm"
            variant="outline"
            onClick={() => onNavigate(`/agents?agent=${encodeURIComponent(a.agent_key)}`)}
          >
            Use with {a.display_name}
          </Button>
        ))}
      </div>

      {entAgents[0] && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Executive Agent Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {entAgents[0].short_desc}
            </div>
            <div>
              <Button onClick={() => onNavigate(`/agents?agent=${encodeURIComponent(entAgents[0].agent_key)}`)}>
                Open {entAgents[0].display_name}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
