import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface BrainDumpSectionProps {
  businessId: Id<"businesses">;
}

export function BrainDumpSection({ businessId }: BrainDumpSectionProps) {
  const initiatives = useQuery(
    api.initiatives.getByBusiness,
    businessId ? { businessId } : "skip"
  );
  
  const initiativeId = initiatives && initiatives.length > 0 ? initiatives[0]._id : null;

  const dumps = useQuery(
    api.initiatives.listBrainDumpsByInitiative,
    initiativeId ? { initiativeId, limit: 10 } : "skip"
  );
  
  const addDump = useMutation(api.initiatives.addBrainDump);

  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!initiativeId) {
      toast.error("No initiative found. Run Phase 0 diagnostics first.");
      return;
    }
    const content = text.trim();
    if (!content) {
      toast.error("Please enter your idea first.");
      return;
    }
    try {
      setSaving(true);
      await addDump({ initiativeId, content });
      setText("");
      toast.success("Saved to Brain Dump");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save brain dump");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Brain Dump</CardTitle>
          <span className="text-xs text-muted-foreground">Capture rough ideas quickly</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Write freely here... (e.g., experiment idea, positioning, offer notes)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-24"
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving || !initiativeId}
          >
            {saving ? "Saving..." : "Save Idea"}
          </Button>
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="text-sm font-medium">Recent ideas</div>
          <div className="space-y-2">
            {Array.isArray(dumps) && dumps.length > 0 ? (
              dumps.map((d: any) => (
                <div key={d._id} className="rounded-md border p-3 text-sm">
                  <div className="text-muted-foreground text-xs mb-1">
                    {new Date(d.createdAt).toLocaleString()}
                  </div>
                  <div className="whitespace-pre-wrap">{d.content}</div>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground text-sm">No entries yet.</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
