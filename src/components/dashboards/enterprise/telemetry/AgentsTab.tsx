import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface AgentsTabProps {
  agents: Array<any>;
}

export function AgentsTab({ agents }: AgentsTabProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Active AI Agents</CardTitle>
        <CardDescription>Real-time agent performance monitoring</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {agents.slice(0, 6).map((agent: any, idx: number) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                agent.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`} />
              <div>
                <span className="text-sm font-medium">{agent.name}</span>
                <div className="text-xs text-muted-foreground">
                  {agent.tasksCompleted || 0} tasks completed
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-bold">{agent.efficiency}%</div>
                <div className="text-xs text-muted-foreground">efficiency</div>
              </div>
              <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                {agent.status}
              </Badge>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
