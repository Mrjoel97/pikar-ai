import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Zap, Activity, BarChart3, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

interface OverviewTabProps {
  entAgents: Array<any>;
  avgEfficiency: number;
  totalTasks: number;
  totalCostSavings: number;
  usageDistribution: Array<{ name: string; value: number; color: string }>;
  onNavigate: (path: string) => void;
}

export function OverviewTab({ 
  entAgents, 
  avgEfficiency, 
  totalTasks, 
  totalCostSavings, 
  usageDistribution,
  onNavigate 
}: OverviewTabProps) {
  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">Active Agents</span>
            </div>
            <div className="text-2xl font-bold">{entAgents.length}</div>
            <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +2 this week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">Avg Efficiency</span>
            </div>
            <div className="text-2xl font-bold">{avgEfficiency.toFixed(0)}%</div>
            <Progress value={avgEfficiency} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-muted-foreground">Tasks This Week</span>
            </div>
            <div className="text-2xl font-bold">{totalTasks.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">+15% vs last week</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Cost Savings</span>
            </div>
            <div className="text-2xl font-bold">${totalCostSavings.toLocaleString()}</div>
            <div className="text-xs text-green-600 mt-1">This week</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-base font-semibold mb-3">Usage Distribution</div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={usageDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {usageDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {usageDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-xs">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-base font-semibold mb-3">Quick Actions</div>
            <div className="space-y-2">
              {entAgents.slice(0, 4).map((agent) => (
                <Button
                  key={agent.agent_key}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onNavigate(`/agents?agent=${encodeURIComponent(agent.agent_key)}`)}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Launch {agent.display_name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
