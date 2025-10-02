import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useState } from "react";

interface EscalationQueueProps {
  businessId: Id<"businesses">;
}

export function EscalationQueue({ businessId }: EscalationQueueProps) {
  const escalations = useQuery(api.governanceAutomation.getEscalations, {
    businessId,
    status: "pending",
  });
  const resolveEscalation = useMutation(api.governanceAutomation.resolveEscalation);

  const [selectedEscalation, setSelectedEscalation] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");

  const handleResolve = async (escalationId: Id<"governanceEscalations">) => {
    if (!resolution.trim()) {
      toast.error("Please provide a resolution note");
      return;
    }

    try {
      await resolveEscalation({ escalationId, resolution });
      toast.success("Escalation resolved");
      setSelectedEscalation(null);
      setResolution("");
    } catch (error) {
      toast.error("Failed to resolve escalation");
    }
  };

  if (!escalations) {
    return <div>Loading escalations...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Escalation Queue
        </CardTitle>
        <CardDescription>
          {escalations.length} pending escalation{escalations.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {escalations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
            <p>No pending escalations</p>
          </div>
        ) : (
          <div className="space-y-3">
            {escalations.map((escalation: any) => (
              <div
                key={escalation._id}
                className="p-4 border rounded-lg space-y-2 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{escalation.workflowName}</h4>
                      <Badge variant="destructive">{escalation.violationType}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Escalated to: {escalation.escalatedTo}
                    </p>
                    {escalation.notes && (
                      <p className="text-sm mt-2 text-muted-foreground italic">
                        "{escalation.notes}"
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {new Date(escalation.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Dialog
                    open={selectedEscalation === escalation._id}
                    onOpenChange={(open) => {
                      if (!open) {
                        setSelectedEscalation(null);
                        setResolution("");
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        onClick={() => setSelectedEscalation(escalation._id)}
                      >
                        Resolve
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Resolve Escalation</DialogTitle>
                        <DialogDescription>
                          Provide details about how this escalation was resolved
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Describe the resolution..."
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                          rows={4}
                        />
                        <Button
                          onClick={() => handleResolve(escalation._id)}
                          className="w-full"
                        >
                          Confirm Resolution
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
