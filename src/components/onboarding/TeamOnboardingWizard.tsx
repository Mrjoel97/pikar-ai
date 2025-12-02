import { useState, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  Circle, 
  Users, 
  Briefcase, 
  Calendar, 
  Award,
  TrendingUp,
  Clock,
  Target,
  Bell,
  FileText,
  Download,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const ROLE_TEMPLATES = [
  { value: "developer", label: "Developer", icon: "💻", tasks: 4 },
  { value: "designer", label: "Designer", icon: "🎨", tasks: 4 },
  { value: "marketing", label: "Marketing", icon: "📢", tasks: 4 },
  { value: "sales", label: "Sales", icon: "💼", tasks: 4 },
  { value: "manager", label: "Manager", icon: "👔", tasks: 4 },
];

const ONBOARDING_STEPS = [
  { id: 0, title: "Welcome & Profile", description: "Basic information and role assignment" },
  { id: 1, title: "Company Overview", description: "Mission, values, and culture" },
  { id: 2, title: "Tools & Access", description: "Set up accounts and permissions" },
  { id: 3, title: "Team Introductions", description: "Meet your colleagues" },
  { id: 4, title: "Role Training", description: "Role-specific training materials" },
  { id: 5, title: "First Tasks", description: "Complete your initial assignments" },
  { id: 6, title: "Feedback & Questions", description: "Share your experience" },
  { id: 7, title: "Completion", description: "Receive your certificate" },
];

const CHART_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export function TeamOnboardingWizard() {
  const { user, business } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState("");
  const [department, setDepartment] = useState("");
  const [notes, setNotes] = useState("");
  const [showAnalytics, setShowAnalytics] = useState(false);

  const createSession = useMutation(api.teamOnboarding.createOnboardingSession);
  const updateProgress = useMutation(api.teamOnboarding.updateOnboardingProgress);
  const userSession = useQuery(
    api.teamOnboarding.getUserOnboardingSession,
    (user as any)?._id ? { userId: (user as any)._id } : "skip"
  );
  const analytics = useQuery(
    api.teamOnboarding.getOnboardingAnalytics,
    (business as any)?._id ? { businessId: (business as any)._id, timeRange: "30d" } : "skip"
  );
  const dashboard = useQuery(
    api.teamOnboarding.getTeamOnboardingDashboard,
    (business as any)?._id ? { businessId: (business as any)._id } : "skip"
  );

  const handleStartOnboarding = async () => {
    const userId = user && (user as any)._id;
    const businessId = business && (business as any)._id;

    if (!userId || !businessId || !selectedRole) {
      toast.error("Please select a role to continue");
      return;
    }

    try {
      await createSession({
        businessId: businessId,
        userId: userId,
        role: selectedRole,
        department: department || undefined,
        startDate: Date.now(),
      });
      toast.success("Onboarding started! Tasks have been assigned.");
      setCurrentStep(1);
    } catch (error) {
      toast.error("Failed to start onboarding");
      console.error(error);
    }
  };

  const handleCompleteStep = async () => {
    if (!userSession?._id) return;

    try {
      const result = await updateProgress({
        sessionId: userSession._id as any,
        stepCompleted: currentStep,
        notes: notes || undefined,
      });
      
      toast.success(`Step ${currentStep + 1} completed! ${result.progress}% done.`);
      setNotes("");
      
      if (currentStep < ONBOARDING_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      toast.error("Failed to update progress");
      console.error(error);
    }
  };

  const roleBreakdownData = useMemo(() => {
    if (!analytics?.roleBreakdown) return [];
    return Object.entries(analytics.roleBreakdown).map(([role, count]) => ({
      name: role.charAt(0).toUpperCase() + role.slice(1),
      value: count as number,
    }));
  }, [analytics]);

  const progressData = useMemo(() => {
    if (!dashboard?.sessions) return [];
    return dashboard.sessions.slice(0, 10).map((s: any) => ({
      name: s.role.substring(0, 3).toUpperCase(),
      progress: s.progress,
    }));
  }, [dashboard]);

  if (showAnalytics && analytics && dashboard) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Team Onboarding Analytics</h2>
            <p className="text-muted-foreground">Track onboarding progress and completion rates</p>
          </div>
          <Button onClick={() => setShowAnalytics(false)} variant="outline">
            Back to Wizard
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalSessions}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.completionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {analytics.completedSessions} of {analytics.totalSessions} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Progress</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.averageProgress}%</div>
              <p className="text-xs text-muted-foreground">Across all sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.averageCompletionDays} days</div>
              <p className="text-xs text-muted-foreground">Time to complete</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Role Distribution</CardTitle>
              <CardDescription>Onboarding sessions by role</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={roleBreakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roleBreakdownData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Progress</CardTitle>
              <CardDescription>Latest onboarding sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="progress" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Onboarding Sessions</CardTitle>
            <CardDescription>Team members currently onboarding</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.sessions.filter((s: any) => s.status === "in_progress").slice(0, 5).map((session: any) => (
                <div key={session._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{session.role}</Badge>
                      {session.department && <Badge variant="secondary">{session.department}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Step {session.currentStep + 1} of {ONBOARDING_STEPS.length}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-2xl font-bold">{session.progress}%</div>
                    <Progress value={session.progress} className="w-32" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Team Onboarding</h2>
          <p className="text-muted-foreground">Streamlined onboarding with automated task assignment</p>
        </div>
        {user?.role === "admin" && (
          <Button onClick={() => setShowAnalytics(true)} variant="outline">
            <TrendingUp className="mr-2 h-4 w-4" />
            View Analytics
          </Button>
        )}
      </div>

      {userSession && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Onboarding Progress</CardTitle>
                <CardDescription>
                  {userSession.status === "completed" 
                    ? "Congratulations! You've completed onboarding." 
                    : `Step ${userSession.currentStep + 1} of ${ONBOARDING_STEPS.length}`}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-emerald-600">{userSession.progress}%</div>
                <p className="text-sm text-muted-foreground">Complete</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={userSession.progress} className="mb-4" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bell className="h-4 w-4" />
              <span>{userSession.tasks?.filter((t: any) => t.status === "todo").length || 0} tasks pending</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={currentStep.toString()} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          {ONBOARDING_STEPS.slice(0, 4).map((step) => (
            <TabsTrigger
              key={step.id}
              value={step.id.toString()}
              disabled={!userSession && step.id > 0}
              className="flex items-center gap-2"
            >
              {userSession?.completedSteps.includes(step.id) ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{step.title}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="0" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Welcome to the Team!
              </CardTitle>
              <CardDescription>
                Let's get you started with role-based onboarding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="role">Select Your Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Choose your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_TEMPLATES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          <span>{role.icon}</span>
                          <span>{role.label}</span>
                          <Badge variant="secondary" className="ml-2">{role.tasks} tasks</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  We'll automatically assign role-specific tasks and training materials
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department (Optional)</Label>
                <Input
                  id="department"
                  placeholder="e.g., Engineering, Marketing"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>

              {selectedRole && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Award className="h-4 w-4 text-emerald-600" />
                    What You'll Get:
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>✓ {ROLE_TEMPLATES.find(r => r.value === selectedRole)?.tasks} automated tasks</li>
                    <li>✓ Role-specific training materials</li>
                    <li>✓ Progress notifications</li>
                    <li>✓ Completion certificate</li>
                  </ul>
                </div>
              )}

              <Button 
                onClick={handleStartOnboarding} 
                disabled={!selectedRole || !!userSession}
                className="w-full"
                size="lg"
              >
                {userSession ? "Already Started" : "Start Onboarding"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {ONBOARDING_STEPS.slice(1).map((step) => (
          <TabsContent key={step.id} value={step.id.toString()} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm">
                    Complete the activities for this step and add any notes below.
                  </p>
                </div>

                {userSession?.tasks && (
                  <div className="space-y-2">
                    <Label>Related Tasks</Label>
                    <div className="space-y-2">
                      {userSession.tasks
                        .filter((t: any) => t.status !== "done")
                        .slice(0, 3)
                        .map((task: any) => (
                          <div key={task._id} className="flex items-start gap-2 p-3 border rounded-lg">
                            <Briefcase className="h-4 w-4 mt-1 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{task.title}</p>
                              <p className="text-xs text-muted-foreground">{task.description}</p>
                            </div>
                            <Badge variant={task.priority === "high" ? "destructive" : "secondary"}>
                              {task.priority}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes or feedback about this step..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={handleCompleteStep}
                  disabled={!userSession || userSession.completedSteps.includes(step.id)}
                  className="w-full"
                  size="lg"
                >
                  {userSession?.completedSteps.includes(step.id) ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Completed
                    </>
                  ) : (
                    "Complete Step"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {userSession?.status === "completed" && (
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-6 w-6 text-emerald-600" />
              Onboarding Complete!
            </CardTitle>
            <CardDescription>
              Congratulations on completing your onboarding journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center p-8">
              <div className="text-center space-y-4">
                <div className="text-6xl">🎉</div>
                <h3 className="text-2xl font-bold">Welcome Aboard!</h3>
                <p className="text-muted-foreground">
                  You're now fully onboarded and ready to contribute to the team.
                </p>
              </div>
            </div>
            <Button className="w-full" size="lg">
              <Download className="mr-2 h-4 w-4" />
              Download Certificate
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}