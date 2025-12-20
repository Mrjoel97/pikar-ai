import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface PendingSeniorRequestsPanelProps {
  pending: Array<{ email: string; role: string; _id: string }> | undefined;
  approveSenior: any;
}

export function PendingSeniorRequestsPanel({ pending, approveSenior }: PendingSeniorRequestsPanelProps) {
  if (!pending || pending.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle id="section-pending-senior">Pending Senior Admin Requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Approve requests to grant Senior Admin privileges.
        </p>
        <div className="rounded-md border">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-muted/40 text-xs font-medium">
            <div>Email</div>
            <div>Status</div>
            <div className="hidden md:block">Action</div>
          </div>
          <Separator />
          <div className="divide-y">
            {pending.map((p) => (
              <div key={p._id} className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 text-sm items-center">
                <div>{p.email}</div>
                <div>
                  <Badge variant="outline">Pending</Badge>
                </div>
                <div className="hidden md:flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={async () => {
                      try {
                        await approveSenior({ email: p.email });
                        toast.success(`Approved ${p.email} as Senior Admin`);
                      } catch (e: any) {
                        toast.error(e?.message || "Approval failed");
                      }
                    }}
                  >
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
