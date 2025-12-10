import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface PerformanceTabProps {
  agentPerformanceData: Array<{
    name: string;
    efficiency: number;
    tasks: number;
    accuracy: number;
    trend: string;
    costSavings: number;
  }>;
}

export function PerformanceTab({ agentPerformanceData }: PerformanceTabProps) {
  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-base font-semibold mb-3">Agent Performance Comparison</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="efficiency" fill="#3b82f6" name="Efficiency %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {agentPerformanceData.slice(0, 3).map((agent, idx) => (
          <motion.div
            key={agent.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium">{agent.name}</div>
                  <Badge variant={agent.trend === "up" ? "default" : agent.trend === "down" ? "destructive" : "secondary"}>
                    {agent.trend}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Efficiency</span>
                    <span className="font-bold">{agent.efficiency.toFixed(1)}%</span>
                  </div>
                  <Progress value={agent.efficiency} className="h-1" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tasks</span>
                    <span className="font-bold">{agent.tasks}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Accuracy</span>
                    <span className="font-bold">{agent.accuracy.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Cost Savings</span>
                    <span className="font-bold text-green-600">${agent.costSavings}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
