import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "react-router";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface TeamOnboardingWidgetProps {
  businessId: Id<"businesses"> | null;
}

export default function TeamOnboardingWidget({ businessId }: TeamOnboardingWidgetProps) {
  const navigate = useNavigate();
  
  const onboardingData = useQuery(
    api.teamOnboarding.getOnboardingStatus,
    businessId ? { businessId } : "skip"
  );

  const startOnboarding = useMutation(api.teamOnboarding.startOnboarding);

  const handleStartOnboarding = async () => {
    if (!businessId) return;
    try {
      await startOnboarding({ businessId, userId: "" as Id<"users"> });
      toast.success("Onboarding started");
      navigate("/onboarding");
    } catch (error) {
      toast.error("Failed to start onboarding");
    }
  };

  const activeOnboarding = onboardingData?.filter((o: any) => o.status === "in_progress") || [];
  const completedOnboarding = onboardingData?.filter((o: any) => o.status === "completed") || [];
  const pendingOnboarding = onboardingData?.filter((o: any) => o.status === "pending") || [];

  const totalProgress = onboardingData?.reduce((sum: number, o: any) => sum + (o.progress || 0), 0) || 0;
  const avgProgress = onboardingData && onboardingData.length > 0 
    ? totalProgress / onboardingData.length 
    : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">Team Onboarding</CardTitle>
        <Button 
          size="sm" 
          onClick={handleStartOnboarding}
          className="h-8"
        >
          <UserPlus className="h-4 w-4 mr-1" />
          Add Member
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Team Progress</span>
            <span className="font-semibold">{Math.round(avgProgress)}%</span>
          </div>
          <Progress value={avgProgress} className="h-2" />
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-2xl font-bold text-blue-700">{activeOnboarding.length}</p>
            <p className="text-xs text-blue-600">Active</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-green-50 border border-green-200">
            <p className="text-2xl font-bold text-green-700">{completedOnboarding.length}</p>
            <p className="text-xs text-green-600">Completed</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-2xl font-bold text-gray-700">{pendingOnboarding.length}</p>
            <p className="text-xs text-gray-600">Pending</p>
          </div>
        </div>

        {/* Active Onboarding */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Active Onboarding</p>
          {activeOnboarding.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active onboarding</p>
          ) : (
            <div className="space-y-2">
              {activeOnboarding.slice(0, 3).map((onboarding: any) => (
                <div 
                  key={onboarding._id}
                  className="flex items-center justify-between p-2 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => navigate(`/onboarding?id=${onboarding._id}`)}
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{onboarding.userName || "New Member"}</p>
                      <p className="text-xs text-muted-foreground">
                        Step {onboarding.currentStep || 1} of {onboarding.totalSteps || 5}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Progress value={onboarding.progress || 0} className="h-2 w-16" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round(onboarding.progress || 0)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate("/onboarding")}
        >
          Manage Onboarding
        </Button>
      </CardContent>
    </Card>
  );
}
