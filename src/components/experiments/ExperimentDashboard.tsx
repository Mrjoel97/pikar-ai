import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Trophy, Pause, Play, TrendingUp } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface ExperimentDashboardProps {
  businessId: Id<"businesses">;
}

export function ExperimentDashboard({ businessId }: ExperimentDashboardProps) {
  const experiments = useQuery(api.experiments.listExperiments, { businessId });
  const updateStatus = useMutation(api.experiments.updateExperimentStatus);
  const declareWinner = useMutation(api.experiments.declareWinner);
  const determineWinner = useAction(api.experiments.determineWinner);

  const runningExperiments = experiments?.filter((e: any) => e.status === "running") || [];
  const completedExperiments = experiments?.filter((e: any) => e.status === "completed") || [];
  const draftExperiments = experiments?.filter((e: any) => e.status === "draft") || [];

  const handlePause = async (experimentId: Id<"experiments">) => {
    try {
      await updateStatus({ experimentId, status: "paused" });
      toast.success("Experiment paused");
    } catch (error) {
      toast.error("Failed to pause experiment");
    }
  };

  const handleResume = async (experimentId: Id<"experiments">) => {
    try {
      await updateStatus({ experimentId, status: "running" });
      toast.success("Experiment resumed");
    } catch (error) {
      toast.error("Failed to resume experiment");
    }
  };

  const handleDetermineWinner = async (experimentId: Id<"experiments">) => {
    try {
      const result = await determineWinner({ experimentId });
      if (result.isSignificant && result.winnerId) {
        toast.success(`Winner determined: ${result.bestVariantKey} with ${result.conversionRate.toFixed(2)}% conversion rate`);
      } else {
        toast.info("No statistically significant winner yet. Continue testing.");
      }
    } catch (error) {
      toast.error("Failed to determine winner");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">A/B Test Experiments</h2>
        <p className="text-muted-foreground">Manage and monitor your email experiments</p>
      </div>

      <Tabs defaultValue="running">
        <TabsList>
          <TabsTrigger value="running">
            Running ({runningExperiments.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedExperiments.length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            Draft ({draftExperiments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="running" className="space-y-4">
          {runningExperiments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No running experiments
              </CardContent>
            </Card>
          ) : (
            runningExperiments.map((experiment: any) => (
              <ExperimentCard
                key={experiment._id}
                experiment={experiment}
                onPause={() => handlePause(experiment._id)}
                onDetermineWinner={() => handleDetermineWinner(experiment._id)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedExperiments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No completed experiments
              </CardContent>
            </Card>
          ) : (
            completedExperiments.map((experiment: any) => (
              <ExperimentCard
                key={experiment._id}
                experiment={experiment}
                isCompleted
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          {draftExperiments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No draft experiments
              </CardContent>
            </Card>
          ) : (
            draftExperiments.map((experiment: any) => (
              <ExperimentCard
                key={experiment._id}
                experiment={experiment}
                onResume={() => handleResume(experiment._id)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ExperimentCard({
  experiment,
  onPause,
  onResume,
  onDetermineWinner,
  isCompleted = false,
}: {
  experiment: any;
  onPause?: () => void;
  onResume?: () => void;
  onDetermineWinner?: () => void;
  isCompleted?: boolean;
}) {
  const results = useQuery(api.experiments.calculateResults, { experimentId: experiment._id });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{experiment.name}</CardTitle>
            <CardDescription>{experiment.hypothesis}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant={experiment.status === "running" ? "default" : "secondary"}>
              {experiment.status}
            </Badge>
            {experiment.winnerVariantId && (
              <Badge variant="default" className="bg-yellow-500">
                <Trophy className="mr-1 h-3 w-3" /> Winner
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {results?.map((variant: any) => (
            <div key={variant.variantId} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">{variant.name}</h4>
                {experiment.winnerVariantId === variant.variantId && (
                  <Trophy className="h-4 w-4 text-yellow-500" />
                )}
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Sent</p>
                  <p className="font-semibold">{variant.metrics.sent}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Open Rate</p>
                  <p className="font-semibold">{variant.openRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Click Rate</p>
                  <p className="font-semibold">{variant.clickRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Conv. Rate</p>
                  <p className="font-semibold">{variant.conversionRate.toFixed(1)}%</p>
                </div>
              </div>
              <Progress value={variant.metrics.sent > 0 ? (variant.metrics.converted / variant.metrics.sent) * 100 : 0} />
            </div>
          ))}
        </div>

        {!isCompleted && (
          <div className="flex gap-2">
            {onPause && (
              <Button variant="outline" size="sm" onClick={onPause}>
                <Pause className="mr-2 h-4 w-4" /> Pause
              </Button>
            )}
            {onResume && (
              <Button variant="outline" size="sm" onClick={onResume}>
                <Play className="mr-2 h-4 w-4" /> Resume
              </Button>
            )}
            {onDetermineWinner && (
              <Button size="sm" onClick={onDetermineWinner}>
                <TrendingUp className="mr-2 h-4 w-4" /> Check Winner
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
