import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface VendorPerformanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: Id<"vendors"> | null;
  onSuccess?: () => void;
}

export function VendorPerformanceDialog({ open, onOpenChange, vendorId, onSuccess }: VendorPerformanceDialogProps) {
  const [onTimeDelivery, setOnTimeDelivery] = useState("");
  const [qualityScore, setQualityScore] = useState("");
  const [responsiveness, setResponsiveness] = useState("");
  const [costEfficiency, setCostEfficiency] = useState("");
  const [notes, setNotes] = useState("");

  const recordPerformance = useMutation(api.vendors.recordPerformance);

  const handleRecord = async () => {
    if (!vendorId || !onTimeDelivery || !qualityScore || !responsiveness || !costEfficiency) {
      toast.error("Please fill in all performance metrics");
      return;
    }

    try {
      await recordPerformance({
        vendorId,
        onTimeDelivery: parseFloat(onTimeDelivery),
        qualityScore: parseFloat(qualityScore),
        responsiveness: parseFloat(responsiveness),
        costEfficiency: parseFloat(costEfficiency),
        notes,
      });
      toast.success("Performance recorded successfully");
      onOpenChange(false);
      // Reset form
      setOnTimeDelivery("");
      setQualityScore("");
      setResponsiveness("");
      setCostEfficiency("");
      setNotes("");
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to record performance");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Vendor Performance</DialogTitle>
          <DialogDescription>Enter performance metrics (0-100)</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>On-Time Delivery (%)</Label>
            <Input type="number" min="0" max="100" value={onTimeDelivery} onChange={(e) => setOnTimeDelivery(e.target.value)} />
          </div>
          <div>
            <Label>Quality Score (%)</Label>
            <Input type="number" min="0" max="100" value={qualityScore} onChange={(e) => setQualityScore(e.target.value)} />
          </div>
          <div>
            <Label>Responsiveness (%)</Label>
            <Input type="number" min="0" max="100" value={responsiveness} onChange={(e) => setResponsiveness(e.target.value)} />
          </div>
          <div>
            <Label>Cost Efficiency (%)</Label>
            <Input type="number" min="0" max="100" value={costEfficiency} onChange={(e) => setCostEfficiency(e.target.value)} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
          <Button onClick={handleRecord} className="w-full">Save Performance</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
