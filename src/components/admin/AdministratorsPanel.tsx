import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface AdministratorsPanelProps {
  adminList: Array<{ _id: string; email: string; role: string }> | undefined;
}

export function AdministratorsPanel({ adminList }: AdministratorsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle id="section-admins">Administrators</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Allowlist: set ADMIN_EMAILS (comma-separated). You can also persist admins in the table below.
        </p>
        <div className="rounded-md border">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-muted/40 text-xs font-medium">
            <div>Email</div>
            <div>Role</div>
            <div className="hidden md:block">Id</div>
          </div>
          <Separator />
          <div className="divide-y">
            {(adminList || []).map((a) => (
              <div key={a._id} className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 text-sm">
                <div>{a.email}</div>
                <div>
                  <Badge variant="outline">{a.role}</Badge>
                </div>
                <div className="hidden md:block text-muted-foreground">{a._id}</div>
              </div>
            ))}
            {(!adminList || adminList.length === 0) && (
              <div className="p-3 text-sm text-muted-foreground">No admins found yet.</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
