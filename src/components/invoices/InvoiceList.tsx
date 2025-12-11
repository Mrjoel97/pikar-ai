import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface InvoiceListProps {
  businessId: Id<"businesses">;
}

export function InvoiceList({ businessId }: InvoiceListProps) {
  const invoices = useQuery(api.invoices.listInvoices, { businessId });
  const markPaid = useMutation(api.invoices.markInvoicePaid);
  const generatePdf = useAction(api.invoicesActions.generateInvoicePdf);
  const sendEmail = useAction(api.invoicesActions.sendInvoiceEmail);

  const handleMarkPaid = async (invoiceId: Id<"invoices">) => {
    try {
      await markPaid({ invoiceId });
      toast.success("Invoice marked as paid");
    } catch (error) {
      toast.error("Failed to mark invoice as paid");
    }
  };

  const handleDownload = async (invoiceId: Id<"invoices">) => {
    try {
      const result = await generatePdf({ invoiceId });
      toast.success("Invoice PDF generated");
      // In production, trigger actual download
      console.log("PDF URL:", result.pdfUrl);
    } catch (error) {
      toast.error("Failed to generate PDF");
    }
  };

  const handleSendEmail = async (invoiceId: Id<"invoices">) => {
    try {
      toast.info("Sending invoice email...");
      const result = await sendEmail({ invoiceId });
      if (result.success) {
        toast.success("Invoice sent successfully!");
      } else {
        toast.error(result.message || "Failed to send invoice");
      }
    } catch (error) {
      toast.error("Failed to send invoice email");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      sent: "default",
      paid: "outline",
      overdue: "destructive",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (!invoices) {
    return <div>Loading invoices...</div>;
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No invoices yet. Create your first invoice to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {invoices.map((invoice: any) => (
        <Card key={invoice._id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">Invoice #{invoice.invoiceNumber}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{invoice.clientName}</p>
              </div>
              {getStatusBadge(invoice.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold">${invoice.total.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">
                  Due: {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleDownload(invoice._id)}>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSendEmail(invoice._id)}
                  disabled={!invoice.clientEmail}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Send
                </Button>
                {invoice.status !== "paid" && (
                  <Button variant="default" size="sm" onClick={() => handleMarkPaid(invoice._id)}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Mark Paid
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}