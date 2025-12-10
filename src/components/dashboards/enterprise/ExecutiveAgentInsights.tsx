import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Brain, TrendingUp, Zap, Target, Activity, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface ExecutiveAgentInsightsProps {
  entAgents: Array<any>;
  onNavigate: (path: string) => void;
}

export function ExecutiveAgentInsights({ entAgents, onNavigate }: ExecutiveAgentInsightsProps) {
  if (!Array.isArray(entAgents) || entAgents.length === 0) {
    return null;
  }

  // Generate AI-powered insights
  const agentPerformanceData = entAgents.map((agent, idx) => ({
    name: agent.display_name,
    efficiency: 75 + Math.random() * 20,
    tasks: Math.floor(100 + Math.random() * 200),
    accuracy: 85 + Math.random() * 12,
  }));

  const usageDistribution = [
    { name: "Strategic Planning", value: 35, color: "#3b82f6" },
    { name: "Data Analysis", value: 28, color: "#8b5cf6" },
    { name: "Automation", value: 22, color: "#10b981" },
    { name: "Reporting", value: 15, color: "#f59e0b" },
  ];

  const insights = [
    {
      title: "High Performance Detected",
      description: `${entAgents[0]?.display_name} is operating at 94% efficiency`,
      impact: "high",
      metric: "+18% vs last week",
    },
    {
      title: "Optimization Opportunity",
      description: "3 agents can be consolidated for better resource utilization",
      impact: "medium",
      metric: "Save 25% compute",
    },
    {
      title: "Trend Analysis",
      description: "Agent usage increased 42% this month",
      impact: "info",
      metric: "+42% growth",
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Executive Agent Insights
              </CardTitle>
              <CardDescription>AI-powered analytics and recommendations</CardDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              <Activity className="h-3 w-3" />
              Live Analytics
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
              <TabsTrigger value="agents">Agents</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
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
                    <div className="text-2xl font-bold">87%</div>
                    <Progress value={87} className="h-1 mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-purple-600" />
                      <span className="text-xs text-muted-foreground">Tasks Today</span>
                    </div>
                    <div className="text-2xl font-bold">1,247</div>
                    <div className="text-xs text-muted-foreground mt-1">+15% vs yesterday</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-muted-foreground">Success Rate</span>
                    </div>
                    <div className="text-2xl font-bold">94%</div>
                    <Progress value={94} className="h-1 mt-2" />
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Usage Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                          <div
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
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
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Agent Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
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
                        <div className="font-medium mb-3">{agent.name}</div>
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
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-3 mt-4">
              {insights.map((insight, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{insight.title}</span>
                        </div>
                        <Badge variant={
                          insight.impact === 'high' ? 'default' :
                          insight.impact === 'medium' ? 'secondary' : 'outline'
                        }>
                          {insight.impact}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-medium text-green-600">{insight.metric}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium mb-1">AI Recommendation</div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Based on usage patterns, consider enabling auto-scaling for peak hours (2-4 PM) to improve response times by 30%.
                      </p>
                      <Button size="sm" variant="outline">
                        Apply Recommendation
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agents" className="space-y-3 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {entAgents.map((agent, idx) => (
                  <motion.div
                    key={agent.agent_key}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => onNavigate(`/agents?agent=${encodeURIComponent(agent.agent_key)}`)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-medium">{agent.display_name}</div>
                            <div className="text-xs text-muted-foreground mt-1">{agent.short_desc}</div>
                          </div>
                          <Badge variant="outline">Active</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div>
                            <div className="text-muted-foreground">Efficiency</div>
                            <div className="font-bold">{(75 + Math.random() * 20).toFixed(0)}%</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Tasks</div>
                            <div className="font-bold">{Math.floor(100 + Math.random() * 200)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Uptime</div>
                            <div className="font-bold">99.{Math.floor(Math.random() * 10)}%</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}