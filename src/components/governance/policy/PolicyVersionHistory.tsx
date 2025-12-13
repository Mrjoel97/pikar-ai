import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, User, FileText, RotateCcw, GitCompare } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface PolicyVersionHistoryProps {
  policyId: Id<"policies">;
}

export function PolicyVersionHistory({ policyId }: PolicyVersionHistoryProps) {
  const versions = useQuery(api.policyManagement.getPolicyVersions, { policyId });
  const revertToVersion = useMutation(api.policyManagement.revertToVersion);
  const [selectedVersions, setSelectedVersions] = useState<[string, string] | null>(null);

  const comparison = useQuery(
    api.policyManagement.compareVersions,
    selectedVersions
      ? {
          policyId,
          version1: selectedVersions[0],
          version2: selectedVersions[1],
        }
      : "skip"
  );

  const handleRevert = async (versionId: Id<"policyVersions">) => {
    try {
      const result = await revertToVersion({ policyId, versionId });
      toast.success(`Reverted to version ${result.newVersion}`);
    } catch (error) {
      toast.error("Failed to revert version");
      console.error(error);
    }
  };

  if (!versions) {
    return <div>Loading version history...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Version History
          </CardTitle>
          <CardDescription>
            Track all changes made to this policy over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {versions.map((version: any, index: number) => (
                <div
                  key={version._id}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={index === 0 ? "default" : "outline"}>
                          v{version.version}
                        </Badge>
                        {index === 0 && (
                          <Badge variant="secondary">Current</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {version.changeNotes}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {version.creatorName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(version.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <FileText className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Version {version.version} Content</DialogTitle>
                            <DialogDescription>
                              Created by {version.creatorName} on{" "}
                              {new Date(version.createdAt).toLocaleDateString()}
                            </DialogDescription>
                          </DialogHeader>
                          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                            <div className="whitespace-pre-wrap text-sm">
                              {version.content}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                      {index !== 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRevert(version._id)}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Revert
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {versions.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Compare Versions
            </CardTitle>
            <CardDescription>
              Select two versions to compare their differences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Version 1</label>
                <select
                  className="w-full p-2 border rounded-md"
                  onChange={(e) =>
                    setSelectedVersions(
                      e.target.value
                        ? [e.target.value, selectedVersions?.[1] || versions[0].version]
                        : null
                    )
                  }
                >
                  <option value="">Select version...</option>
                  {versions.map((v: any) => (
                    <option key={v._id} value={v.version}>
                      v{v.version}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Version 2</label>
                <select
                  className="w-full p-2 border rounded-md"
                  onChange={(e) =>
                    setSelectedVersions(
                      e.target.value
                        ? [selectedVersions?.[0] || versions[1].version, e.target.value]
                        : null
                    )
                  }
                >
                  <option value="">Select version...</option>
                  {versions.map((v: any) => (
                    <option key={v._id} value={v.version}>
                      v{v.version}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {comparison && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Version {comparison.version1.version}</h4>
                    <p className="text-xs text-muted-foreground">
                      {new Date(comparison.version1.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Version {comparison.version2.version}</h4>
                    <p className="text-xs text-muted-foreground">
                      {new Date(comparison.version2.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Changes:</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant={comparison.changes.contentChanged ? "destructive" : "secondary"}>
                        {comparison.changes.contentChanged ? "Content Modified" : "No Content Changes"}
                      </Badge>
                    </div>
                    {comparison.changes.changeNotes && (
                      <p className="text-muted-foreground italic">
                        "{comparison.changes.changeNotes}"
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Time between versions: {Math.round(comparison.changes.timeDiff / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
