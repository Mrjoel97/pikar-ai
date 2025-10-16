import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface VendorCreateDialogProps {
  businessId?: Id<"businesses">;
  onSuccess?: () => void;
}

export function VendorCreateDialog({ businessId, onSuccess }: VendorCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [category, setCategory] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contractStart, setContractStart] = useState("");
  const [contractEnd, setContractEnd] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [notes, setNotes] = useState("");

  const createVendor = useMutation(api.vendors.createVendor);

  const handleCreate = async () => {
    if (!businessId || !vendorName || !category || !contactName || !contactEmail || !contractStart || !contractEnd || !contractValue) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createVendor({
        businessId,
        name: vendorName,
        category,
        contactName,
        contactEmail,
        contractStart: new Date(contractStart).getTime(),
        contractEnd: new Date(contractEnd).getTime(),
        contractValue: parseFloat(contractValue),
        notes,
      });
      toast.success("Vendor created successfully");
      setOpen(false);
      // Reset form
      setVendorName("");
      setCategory("");
      setContactName("");
      setContactEmail("");
      setContractStart("");
      setContractEnd("");
      setContractValue("");
      setNotes("");
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to create vendor");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Vendor</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
          <DialogDescription>Enter vendor details and contract information</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Vendor Name *</Label>
              <Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="Company name" />
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Software">Software</SelectItem>
                  <SelectItem value="Logistics">Logistics</SelectItem>
                  <SelectItem value="Consulting">Consulting</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Services">Services</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Contact Name *</Label>
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Primary contact" />
            </div>
            <div>
              <Label>Contact Email *</Label>
              <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="email@example.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Contract Start *</Label>
              <Input type="date" value={contractStart} onChange={(e) => setContractStart(e.target.value)} />
            </div>
            <div>
              <Label>Contract End *</Label>
              <Input type="date" value={contractEnd} onChange={(e) => setContractEnd(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Contract Value ($) *</Label>
            <Input type="number" value={contractValue} onChange={(e) => setContractValue(e.target.value)} placeholder="Annual value" />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional information..." rows={3} />
          </div>
          <Button onClick={handleCreate} className="w-full">Create Vendor</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
