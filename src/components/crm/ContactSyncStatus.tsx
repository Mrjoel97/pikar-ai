import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle, GitMerge } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface ContactSyncStatusProps {
  businessId: Id<"businesses">;
}

export default function ContactSyncStatus({ businessId }: ContactSyncStatusProps) {
  const conflicts = useQuery(api.crmIntegrations.listConflicts, { businessId });
  const resolveConflict = useMutation(api.crmIntegrations.resolveConflict);

  const handleResolve = async (
    conflictId: Id<"crmSyncConflicts">,
    resolution: "keep_local" | "keep_remote" | "merge"
  ) => {
    try {
      await resolveConflict({ conflictId, resolution });
      toast.success("Conflict resolved successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to resolve conflict");
    }
  };

  if (!conflicts || conflicts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Contact Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              All contacts are synced. No conflicts detected.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Contact Sync Conflicts
          <Badge variant="destructive">{conflicts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {conflicts.map((conflict: any) => (
          <Card key={conflict._id} className="border-amber-200">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{conflict.contactEmail}</h4>
                    <p className="text-sm text-muted-foreground">
                      Conflict Type: {conflict.conflictType}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-amber-600 border-amber-600">
                    Pending
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded bg-blue-50 border border-blue-200">
                    <p className="font-medium text-blue-900 mb-1">Local Version</p>
                    <pre className="text-xs text-blue-700 whitespace-pre-wrap">
                      {JSON.stringify(conflict.localData, null, 2)}
                    </pre>
                  </div>
                  <div className="p-3 rounded bg-purple-50 border border-purple-200">
                    <p className="font-medium text-purple-900 mb-1">Remote Version</p>
                    <pre className="text-xs text-purple-700 whitespace-pre-wrap">
                      {JSON.stringify(conflict.remoteData, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolve(conflict._id, "keep_local")}
                  >
                    Keep Local
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolve(conflict._id, "keep_remote")}
                  >
                    Keep Remote
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleResolve(conflict._id, "merge")}
                  >
                    <GitMerge className="h-3 w-3 mr-1" />
                    Merge Both
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
