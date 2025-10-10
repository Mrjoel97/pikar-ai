import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface TeamMember {
  userId: string;
  name: string;
  contributions: number;
  approvals: number;
  tasks: number;
}

interface TeamPerformanceData {
  summary: {
    totalContributions: number;
    totalApprovals: number;
    totalTasks: number;
  };
  teamMembers: TeamMember[];
}

interface TeamPerformanceProps {
  teamPerformance: TeamPerformanceData | null | undefined;
  isGuest: boolean;
}

export function TeamPerformance({ teamPerformance, isGuest }: TeamPerformanceProps) {
  return (
    <section className="mb-6">
      <h2 className="text-lg font-semibold mb-3">Team Performance (7d)</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Contributions</div>
            <div className="text-2xl font-bold">
              {teamPerformance?.summary.totalContributions || (isGuest ? 27 : 0)}
            </div>
            <div className="text-xs text-emerald-600">+{isGuest ? 2 : 0} vs prior</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Approvals Completed</div>
            <div className="text-2xl font-bold">
              {teamPerformance?.summary.totalApprovals || (isGuest ? 7 : 0)}
            </div>
            <div className="text-xs text-emerald-600">SLA improving</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Tasks Completed</div>
            <div className="text-2xl font-bold">
              {teamPerformance?.summary.totalTasks || (isGuest ? 12 : 0)}
            </div>
            <div className="text-xs text-emerald-600">Momentum up</div>
          </CardContent>
        </Card>
      </div>

      {/* Team Leaderboard */}
      {teamPerformance && teamPerformance.teamMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Team Leaderboard
            </CardTitle>
            <CardDescription>Top contributors this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamPerformance.teamMembers.slice(0, 5).map((member, idx) => (
                <div key={member.userId} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                    idx === 1 ? 'bg-gray-100 text-gray-700' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{member.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{member.userId}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{member.contributions}</div>
                    <div className="text-xs text-muted-foreground">contributions</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guest mode fallback leaderboard */}
      {isGuest && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Team Leaderboard
            </CardTitle>
            <CardDescription>Top contributors this week (Demo)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Sarah Chen", email: "sarah@demo.com", contributions: 15 },
                { name: "Mike Johnson", email: "mike@demo.com", contributions: 12 },
                { name: "Alex Rivera", email: "alex@demo.com", contributions: 8 },
              ].map((member, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                    idx === 1 ? 'bg-gray-100 text-gray-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{member.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{member.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{member.contributions}</div>
                    <div className="text-xs text-muted-foreground">contributions</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
