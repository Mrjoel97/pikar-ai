import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useMemo } from "react";

export default function AdminPage() {
  const navigate = useNavigate();
  const isAdmin = useQuery(api.admin.getIsAdmin, {} as any);
  const ensureAdmin = useMutation(api.admin.ensureAdminSelf);
  const requestSenior = useMutation(api.admin.requestSeniorAdmin);
  const approveSenior = useMutation(api.admin.approveSeniorAdmin);
  const pending = useQuery(
    api.admin.listPendingAdminRequests as any,
    isAdmin ? {} : undefined
  ) as Array<{ email: string; role: string; _id: string }> | undefined;
  const adminList = useQuery(
    api.admin.listAdmins as any,
    isAdmin ? {} : undefined
  ) as Array<{ _id: string; email: string; role: string }> | undefined;

  const myRole = useMemo(() => {
    if (!adminList) return null;
    // We don't have current user's email here; rely on privileges to show sections.
    // Super admin can see pending; senior cannot. We'll gate by presence of 'pending' list.
    return null;
  }, [adminList]);

  if (isAdmin === undefined) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">Loading...</CardContent>
        </Card>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You don't have access to the Admin Panel.
            </p>
            <p className="text-xs text-muted-foreground">
              If your email is in the ADMIN_EMAILS allowlist (comma-separated), you can claim super admin:
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await ensureAdmin({});
                    toast.success("Admin access claimed. Reloading...");
                    window.location.reload();
                  } catch (e: any) {
                    toast.error(e?.message || "Failed to claim admin");
                  }
                }}
              >
                Claim Super Admin (Allowlist)
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    await requestSenior({});
                    toast.success("Requested Senior Admin access. A Super Admin must approve.");
                  } catch (e: any) {
                    toast.error(e?.message || "Failed to request Senior Admin");
                  }
                }}
              >
                Request Senior Admin
              </Button>
            </div>
            <Separator />
            <Button variant="secondary" onClick={() => navigate("/auth")}>
              Sign in / Create Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <Button variant="secondary" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-emerald-300 text-emerald-700">
              Access: Admin
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            This is the admin-only area. Share the features/workflows you want here and I'll wire them up.
          </p>
        </CardContent>
      </Card>

      {/* Pending Requests (Super Admin only): pending list appears only if API returns data */}
      {(pending && pending.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Senior Admin Requests</CardTitle>
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
      )}

      <Card>
        <CardHeader>
          <CardTitle>Administrators</CardTitle>
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
    </div>
  );
}