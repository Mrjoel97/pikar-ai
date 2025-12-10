import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Plus, Trash2, Clock, TrendingUp, PieChart, Target, BarChart2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

interface WinsHistoryProps {
  businessId: Id<"businesses">;
}

export function WinsHistory({ businessId }: WinsHistoryProps) {
  const wins = useQuery(api.winsHistory.getWins, { businessId, limit: 20 });
  const streak = useQuery(api.winsHistory.getWinStreak, { businessId });
  const timeSaved = useQuery(api.winsHistory.getTotalTimeSaved, { businessId });
  const categories = useQuery(api.winsHistory.getWinsByCategory, { businessId });
  const trends = useQuery(api.winsHistory.getWinsTrend, { businessId, days: 30 });
  const alignment = useQuery(api.winsHistory.trackGoalAlignment, { businessId });
  
  const recordWin = useMutation(api.winsHistory.recordWin);
  const deleteWin = useMutation(api.winsHistory.deleteWin);
  const clearAllWins = useMutation(api.winsHistory.clearAllWins);

  const [showDialog, setShowDialog] = useState(false);
  const [newWin, setNewWin] = useState({
    title: "",
    description: "",
    impact: "",
    timeSaved: 0,
    category: "other" as const,
  });

  const handleRecordWin = async () => {
    if (!newWin.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    try {
      await recordWin({
        businessId,
        ...newWin,
      });
      toast.success("Win recorded! 🎉");
      setShowDialog(false);
      setNewWin({ title: "", description: "", impact: "", timeSaved: 0, category: "other" });
    } catch (error) {
      toast.error("Failed to record win");
    }
  };

  const handleDeleteWin = async (winId: Id<"wins">) => {
    try {
      await deleteWin({ winId });
      toast.success("Win deleted");
    } catch (error) {
      toast.error("Failed to delete win");
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all wins?")) return;
    
    try {
      await clearAllWins({ businessId });
      toast.success("All wins cleared");
    } catch (error) {
      toast.error("Failed to clear wins");
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          <h2 className="text-xl font-semibold">Wins History</h2>
        </div>
        <div className="flex items-center gap-2">
          {streak && <Badge variant="secondary">🔥 {streak.streak}d streak</Badge>}
          {timeSaved && <Badge variant="outline">⏱️ {timeSaved.totalHours}h saved</Badge>}
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Record Win
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record a Win 🎉</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={newWin.title}
                    onChange={(e) => setNewWin({ ...newWin, title: e.target.value })}
                    placeholder="e.g., Closed first customer"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newWin.description}
                    onChange={(e) => setNewWin({ ...newWin, description: e.target.value })}
                    placeholder="Details about this win..."
                  />
                </div>
                <div>
                  <Label>Impact</Label>
                  <Input
                    value={newWin.impact}
                    onChange={(e) => setNewWin({ ...newWin, impact: e.target.value })}
                    placeholder="e.g., $5k MRR, 10 new users"
                  />
                </div>
                <div>
                  <Label>Time Saved (minutes)</Label>
                  <Input
                    type="number"
                    value={newWin.timeSaved}
                    onChange={(e) => setNewWin({ ...newWin, timeSaved: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={newWin.category} onValueChange={(v: any) => setNewWin({ ...newWin, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automation">Automation</SelectItem>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="efficiency">Efficiency</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleRecordWin} className="w-full">
                  Record Win
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button size="sm" variant="outline" onClick={handleClearAll}>
            Clear All
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Recent Wins</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-600" />
                  <div>
                    <div className="text-2xl font-bold">{wins?.length || 0}</div>
                    <div className="text-xs text-muted-foreground">Total Wins</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">{streak?.streak || 0}</div>
                    <div className="text-xs text-muted-foreground">Day Streak</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">{timeSaved?.totalHours || 0}h</div>
                    <div className="text-xs text-muted-foreground">Time Saved</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Wins List */}
          {wins && wins.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {wins.map((win) => (
                <Card key={win._id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm">{win.title}</h3>
                          {win.category && (
                            <Badge variant="outline" className="text-xs">
                              {win.category}
                            </Badge>
                          )}
                        </div>
                        {win.description && (
                          <p className="text-xs text-muted-foreground mb-1">{win.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {win.impact && <span>💪 {win.impact}</span>}
                          {win.timeSaved && win.timeSaved > 0 && <span>⏱️ {win.timeSaved}m saved</span>}
                          <span>{new Date(win.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteWin(win._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">
                  No wins recorded yet. Start celebrating your achievements!
                </p>
                <Button onClick={() => setShowDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Record Your First Win
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Wins by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories?.map((cat: any) => (
                    <div key={cat.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="capitalize text-sm">{cat.category}</span>
                      </div>
                      <div className="text-sm font-medium">{cat.count} wins</div>
                    </div>
                  ))}
                  {(!categories || categories.length === 0) && (
                    <div className="text-sm text-muted-foreground">No data available</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Goal Alignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {alignment ? (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-muted/20 rounded-lg">
                      <div className="text-3xl font-bold text-primary">{alignment.overallAlignment}%</div>
                      <div className="text-xs text-muted-foreground">Overall Alignment Score</div>
                    </div>
                    <div className="space-y-2">
                      {alignment.goals.map((goal: any, i: number) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{goal.name}</span>
                            <span>{goal.alignmentScore}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500" 
                              style={{ width: `${goal.alignmentScore}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground italic mt-2">
                      💡 {alignment.suggestion}
                    </p>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Calculating alignment...</div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart2 className="h-5 w-5" />
                  30-Day Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trends ? (
                  <div className="h-[150px] flex items-end gap-1">
                    {trends.map((day: any, i: number) => (
                      <div 
                        key={i} 
                        className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t-sm relative group"
                        style={{ height: `${Math.max((day.count / 5) * 100, 5)}%` }}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block text-xs bg-popover p-1 rounded shadow">
                          {day.count} wins
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Loading trends...</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}