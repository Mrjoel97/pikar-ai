import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  Briefcase, 
  Network, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  ArrowRight,
  Users,
  DollarSign
} from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type PortfolioOverview = {
  totalInitiatives: number;
  activeInitiatives: number;
  completedInitiatives: number;
  totalBudget: number;
  totalSpent: number;
  overallHealth: string;
  initiatives: Array<{
    id: Id<"initiatives">;
    name: string;
    status: string;
    phase: number;
    priority: string;
  }>;
};

type ResourceAllocation = {
  totalResources: number;
  allocated: number;
  available: number;
  utilizationRate: number;
  byInitiative: Array<{
    initiativeId: Id<"initiatives">;
    initiativeName: string;
    resourceType: string;
    allocated: number;
    capacity: number;
    utilization: number;
  }>;
};

type RiskAssessment = {
  overallRiskScore: number;
  riskLevel: string;
  risks: Array<{
    _id: Id<"portfolioRisks">;
    riskType: string;
    description: string;
    impact: number;
    probability: number;
    initiativeName: string;
    status: string;
  }>;
  mitigationStrategies: string[];
};

export function PortfolioDashboard({ businessId }: { businessId?: Id<"businesses"> | null }) {
  const overview = useQuery(
    api.portfolioManagement.getPortfolioOverview,
    businessId ? { businessId } : undefined
  ) as PortfolioOverview | undefined;

  const dependencies = useQuery(
    api.portfolioManagement.getInitiativeDependencies,
    businessId ? { businessId } : undefined
  );

  const resourceAllocation = useQuery(
    api.portfolioManagement.getResourceAllocation,
    businessId ? { businessId } : undefined
  ) as ResourceAllocation | undefined;

  const riskAssessment = useQuery(
    api.portfolioManagement.getPortfolioRiskAssessment,
    businessId ? { businessId } : undefined
  ) as RiskAssessment | undefined;

  const optimizeResources = useMutation(api.portfolioManagement.optimizeResourceAllocation);

  const handleOptimize = async () => {
    if (!businessId) return;
    try {
      const result = await optimizeResources({ businessId });
      toast.success(`Generated ${result.suggestions.length} optimization suggestions`);
    } catch (error: any) {
      toast.error(error.message || "Failed to optimize resources");
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case "healthy": return "bg-green-100 text-green-700 border-green-300";
      case "warning": return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "critical": return "bg-red-100 text-red-700 border-red-300";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low": return "bg-green-100 text-green-700 border-green-300";
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "high": return "bg-orange-100 text-orange-700 border-orange-300";
      case "critical": return "bg-red-100 text-red-700 border-red-300";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  if (!businessId) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Briefcase className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <div className="font-medium">Sign in to access Portfolio Management</div>
          <div className="text-sm text-muted-foreground">This feature requires a business context.</div>
        </CardContent>
      </Card>
    );
  }

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Global Initiative Portfolio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enterprise-wide portfolio management and optimization
          </p>
        </div>
        <Button onClick={handleOptimize}>
          <TrendingUp className="h-4 w-4 mr-2" />
          Optimize Resources
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{overview?.totalInitiatives || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Total Initiatives</div>
              </div>
              <Briefcase className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{overview?.activeInitiatives || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Active</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {typeof resourceAllocation?.utilizationRate === "number"
                    ? Math.round(resourceAllocation.utilizationRate)
                    : 0}
                  %
                </div>
                <div className="text-xs text-muted-foreground mt-1">Resource Utilization</div>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{riskAssessment?.overallRiskScore || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Risk Score</div>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Health */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Health</CardTitle>
          <CardDescription>Overall portfolio status and key metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium mb-1">Overall Health</div>
              <Badge variant="outline" className={getHealthColor(overview?.overallHealth || "unknown")}>
                {overview?.overallHealth || "Unknown"}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium mb-1">Budget Utilization</div>
              <div className="text-2xl font-bold">
                ${(overview?.totalSpent || 0).toLocaleString()} / ${(overview?.totalBudget || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Allocation */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Allocation by Initiative</CardTitle>
          <CardDescription>Current resource distribution across portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={resourceAllocation?.byInitiative || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="initiativeName" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="utilization" fill="#3b82f6" name="Utilization %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Initiative Dependencies */}
      <Card>
        <CardHeader>
          <CardTitle>Initiative Dependencies</CardTitle>
          <CardDescription>Cross-initiative relationships and blockers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dependencies?.map((dep: any) => (
              <div key={dep._id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Network className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{dep.sourceName}</div>
                    <div className="text-xs text-muted-foreground">{dep.dependencyType}</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">{dep.targetName}</div>
              </div>
            ))}
            {(!dependencies || dependencies.length === 0) && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No dependencies mapped
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Risks */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Risk Assessment</CardTitle>
          <CardDescription>
            Overall risk level: <Badge variant="outline" className={getRiskColor(riskAssessment?.riskLevel || "low")}>
              {riskAssessment?.riskLevel || "Low"}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {riskAssessment?.risks.map((risk) => (
              <div key={risk._id} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-medium">{risk.riskType}</div>
                    <div className="text-xs text-muted-foreground">{risk.initiativeName}</div>
                  </div>
                  <Badge variant="outline" className={getRiskColor(risk.status)}>
                    Impact: {risk.impact} | Probability: {risk.probability}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">{risk.description}</div>
              </div>
            ))}
            {(!riskAssessment?.risks || riskAssessment.risks.length === 0) && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No active risks identified
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}