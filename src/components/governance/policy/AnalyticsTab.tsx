import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Id } from "@/convex/_generated/dataModel";

interface AnalyticsTabProps {
  businessId: Id<"businesses">;
  effectiveness: any[];
  trends: any[];
}

export function AnalyticsTab({ businessId, effectiveness, trends }: AnalyticsTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{effectiveness?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Acknowledgment Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {effectiveness
                ? Math.round(
                    effectiveness.reduce((sum: number, e: any) => sum + e.acknowledgmentRate, 0) /
                      effectiveness.length
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Effectiveness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {effectiveness
                ? Math.round(
                    effectiveness.reduce((sum: number, e: any) => sum + e.effectivenessScore, 0) /
                      effectiveness.length
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Policy Effectiveness</CardTitle>
          <CardDescription>Track acknowledgment rates and compliance</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policy</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Acknowledgment Rate</TableHead>
                <TableHead>Violations</TableHead>
                <TableHead>Effectiveness Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {effectiveness?.map((item: any) => (
                <TableRow key={item.policyId}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={item.acknowledgmentRate} className="w-20" />
                      <span className="text-sm">{Math.round(item.acknowledgmentRate)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.relatedViolations > 0 ? (
                      <Badge variant="destructive">{item.relatedViolations}</Badge>
                    ) : (
                      <Badge variant="outline">0</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.effectivenessScore >= 80
                          ? "default"
                          : item.effectivenessScore >= 60
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {item.effectivenessScore}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}