import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, TrendingUp, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router";
import { Id } from "@/convex/_generated/dataModel";

interface ABTestingWidgetProps {
  businessId: Id<"businesses"> | null;
}

export function ABTestingWidget({ businessId }: ABTestingWidgetProps) {
  const navigate = useNavigate();
  
  const experiments = useQuery(
    api.experiments.listExperiments,
    businessId ? { businessId } : "skip"
  );

  const runningExperiments = experiments?.filter(e => e.status === "running") || [];
  const completedExperiments = experiments?.filter(e => e.status === "completed") || [];

  const recentExperiments = experiments?.slice(0, 3) || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">A/B Testing</CardTitle>
        <Button 
          size="sm" 
          onClick={() => navigate("/experiments")}
          className="h-8"
        >
          <FlaskConical className="h-4 w-4 mr-1" />
          New Test
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Running</span>
            </div>
            <p className="text-2xl font-bold">{runningExperiments.length}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span>Completed</span>
            </div>
            <p className="text-2xl font-bold">{completedExperiments.length}</p>
          </div>
        </div>

        {/* Recent Experiments */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Recent Tests</p>
          {recentExperiments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No experiments yet</p>
          ) : (
            <div className="space-y-2">
              {recentExperiments.map((experiment) => (
                <div 
                  key={experiment._id}
                  className="flex items-center justify-between p-2 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => navigate(`/experiments?id=${experiment._id}`)}
                >
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{experiment.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Goal: {experiment.goal}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      experiment.status === "running" ? "default" : 
                      experiment.status === "completed" ? "secondary" : 
                      "outline"
                    }
                    className="text-xs"
                  >
                    {experiment.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate("/experiments")}
        >
          View All Experiments
        </Button>
      </CardContent>
    </Card>
  );
}
