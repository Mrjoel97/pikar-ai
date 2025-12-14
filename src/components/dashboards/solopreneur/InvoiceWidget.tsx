import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, DollarSign, Clock } from "lucide-react";
import { useNavigate } from "react-router";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaymentProcessor } from "@/components/invoices/PaymentProcessor";

interface InvoiceWidgetProps {
  businessId: Id<"businesses"> | null;
}

interface Invoice {
  _id: Id<"invoices">;
  status: "draft" | "sent" | "paid" | "overdue";
  total: number;
  amount?: number;
  invoiceNumber: string;
  clientName: string;
  currency?: string;
  clientEmail?: string;
}

export function InvoiceWidget({ businessId }: InvoiceWidgetProps) {
  const navigate = useNavigate();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  const invoices = useQuery(
    api.invoices.listInvoices,
    businessId ? { businessId } : "skip"
  );

  const draftCount = invoices?.filter((inv: Invoice) => inv.status === "draft").length || 0;
  const sentCount = invoices?.filter((inv: Invoice) => inv.status === "sent").length || 0;
  const overdueCount = invoices?.filter((inv: Invoice) => inv.status === "overdue").length || 0;
  const totalRevenue = invoices?.filter((inv: Invoice) => inv.status === "paid")
    .reduce((sum: number, inv: Invoice) => sum + inv.total, 0) || 0;

  const totalInvoiced = invoices?.reduce((sum: number, inv: Invoice) => sum + (inv.amount || 0), 0) || 0;
  const totalPaid = invoices?.filter((inv: Invoice) => inv.status === "paid").reduce((sum: number, inv: Invoice) => sum + (inv.amount || 0), 0) || 0;
  const totalPending = invoices?.filter((inv: Invoice) => inv.status === "pending" as any).reduce((sum: number, inv: Invoice) => sum + (inv.amount || 0), 0) || 0;
  const totalOverdue = invoices?.filter((inv: Invoice) => inv.status === "overdue").reduce((sum: number, inv: Invoice) => sum + (inv.amount || 0), 0) || 0;

  const recentInvoices = invoices?.slice(0, 5) || [];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold">Invoices</CardTitle>
          <Button 
            size="sm" 
            onClick={() => navigate("/invoices")}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Invoice
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Revenue</span>
              </div>
              <p className="text-2xl font-bold">${(totalRevenue / 100).toFixed(0)}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Overdue</span>
              </div>
              <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {draftCount} Draft
            </Badge>
            <Badge variant="outline" className="text-xs">
              {sentCount} Sent
            </Badge>
          </div>

          {/* Recent Invoices */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Recent</p>
            {recentInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices yet</p>
            ) : (
              <div className="space-y-2">
                {recentInvoices.map((invoice: Invoice) => (
                  <div 
                    key={invoice._id}
                    className="flex items-center justify-between p-2 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => setSelectedInvoice(invoice)}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">{invoice.clientName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">${invoice.total.toFixed(2)}</p>
                      <Badge 
                        variant={
                          invoice.status === "paid" ? "default" : 
                          invoice.status === "overdue" ? "destructive" : 
                          "secondary"
                        }
                        className="text-xs"
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate("/invoices")}
          >
            View All Invoices
          </Button>
        </CardContent>
      </Card>

      {/* Payment Processor Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <PaymentProcessor
              invoiceId={selectedInvoice._id}
              invoiceNumber={selectedInvoice.invoiceNumber}
              total={selectedInvoice.total}
              currency={selectedInvoice.currency || "USD"}
              clientEmail={selectedInvoice.clientEmail || ""}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}