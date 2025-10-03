import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export function BrainDumpSection({ businessId }: { businessId: string }) {
  const initiatives = useQuery(api.initiatives.getByBusiness as any, businessId ? { businessId } : undefined);
  const initiativeId = initiatives && initiatives.length > 0 ? initiatives[0]._id : null;

  const dumps = useQuery(
    api.initiatives.listBrainDumpsByInitiative as any,
    initiativeId ? { initiativeId, limit: 10 } : undefined
  );
  const addDump = useMutation(api.initiatives.addBrainDump as any);

  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!initiativeId) {
      toast("No initiative found. Run Diagnostics first.");
      return;
    }
    const content = text.trim();
    if (!content) {
      toast("Please enter your idea first.");
      return;
    }
    try {
      setSaving(true);
      await addDump({ initiativeId, content });
      setText("");
      toast("Saved to Brain Dump");
    } catch (e: any) {
      toast(e?.message || "Failed to save brain dump");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Brain Dump</h2>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Capture rough ideas for strategic initiatives
            </span>
            <Badge variant="outline">Enterprise</Badge>
          </div>
          <Separator className="my-3" />
          <Textarea
            placeholder="Write freely here... (e.g., initiative idea, risks, opportunities)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-24"
          />
          <div className="flex justify-end mt-3">
            <Button onClick={handleSave} disabled={saving || !initiativeId}>
              {saving ? "Saving..." : "Save Idea"}
            </Button>
          </div>
          <Separator className="my-4" />
          <div className="space-y-2">
            <div className="text-sm font-medium">Recent ideas</div>
            <div className="space-y-2">
              {Array.isArray(dumps) && dumps.length > 0 ? (
                dumps.map((d: any) => (
                  <div key={String(d._id)} className="rounded-md border p-3 text-sm">
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
    </section>
  );
}
