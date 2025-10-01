import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface InvoiceComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: Id<"businesses">;
}

export function InvoiceComposer({ open, onOpenChange, businessId }: InvoiceComposerProps) {
  const createInvoice = useMutation(api.invoices.createInvoice);

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now()}`);
  const [dueDate, setDueDate] = useState("");
  const [taxRate, setTaxRate] = useState(10);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unitPrice: 0, amount: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate amount
    if (field === "quantity" || field === "unitPrice") {
      newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice;
    }
    
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  const handleSubmit = async () => {
    if (!clientName || !clientEmail || items.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await createInvoice({
        businessId,
        invoiceNumber,
        clientName,
        clientEmail,
        clientAddress: clientAddress || undefined,
        items,
        subtotal,
        taxRate,
        taxAmount,
        total,
        currency: "USD",
        issueDate: Date.now(),
        dueDate: dueDate ? new Date(dueDate).getTime() : Date.now() + 30 * 24 * 60 * 60 * 1000,
        notes: notes || undefined,
      });

      toast.success("Invoice created successfully!");
      onOpenChange(false);
      
      // Reset form
      setClientName("");
      setClientEmail("");
      setClientAddress("");
      setNotes("");
      setItems([{ description: "", quantity: 1, unitPrice: 0, amount: 0 }]);
    } catch (error) {
      toast.error("Failed to create invoice");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Invoice
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-4">
            <div>
              <Label>Invoice Number</Label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
            </div>

            <div>
              <Label>Client Name *</Label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>

            <div>
              <Label>Client Email *</Label>
              <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
            </div>

            <div>
              <Label>Client Address</Label>
              <Textarea value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} rows={2} />
            </div>

            <div>
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            <div>
              <Label>Tax Rate (%)</Label>
              <Input type="number" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} />
            </div>

            <div>
              <Label>Items</Label>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <Card key={index} className="p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        className="flex-1 mr-2"
                      />
                      {items.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                      />
                      <Input
                        type="number"
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))}
                      />
                      <Input value={`$${item.amount.toFixed(2)}`} disabled />
                    </div>
                  </Card>
                ))}
                <Button variant="outline" size="sm" onClick={addItem} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="border rounded-lg p-6 bg-white">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">INVOICE</h2>
              <p className="text-sm text-muted-foreground">#{invoiceNumber}</p>
            </div>

            <div className="mb-4">
              <p className="font-semibold">Bill To:</p>
              <p>{clientName || "Client Name"}</p>
              <p className="text-sm text-muted-foreground">{clientEmail || "client@example.com"}</p>
            </div>

            <div className="border-t pt-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Item</th>
                    <th className="text-right py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2">{item.description || `Item ${i + 1}`}</td>
                      <td className="text-right">${item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({taxRate}%):</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Invoice"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
