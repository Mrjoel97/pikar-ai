import React, { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, DollarSign, Copy, Check, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import QRCode from "qrcode";

interface PaymentProcessorProps {
  invoiceId: Id<"invoices">;
  invoiceNumber: string;
  total: number;
  currency: string;
  clientEmail: string;
}

export function PaymentProcessor({
  invoiceId,
  invoiceNumber,
  total,
  currency,
  clientEmail,
}: PaymentProcessorProps) {
  const [loading, setLoading] = useState<"stripe" | "paypal" | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createStripeLink = useAction(api.payments.stripe.createStripePaymentLink);
  const createPayPalInvoice = useAction(api.payments.paypal.createPayPalInvoice);

  const handleStripePayment = async () => {
    setLoading("stripe");
    try {
      const result = await createStripeLink({ invoiceId });
      if (result.success && result.paymentLink) {
        setPaymentLink(result.paymentLink);
        
        // Generate QR code
        const qr = await QRCode.toDataURL(result.paymentLink);
        setQrCode(qr);
        
        toast.success("Stripe payment link created!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create Stripe payment link");
    } finally {
      setLoading(null);
    }
  };

  const handlePayPalPayment = async () => {
    setLoading("paypal");
    try {
      const result = await createPayPalInvoice({ invoiceId });
      if (result.success && result.paymentLink) {
        setPaymentLink(result.paymentLink);
        
        // Generate QR code
        const qr = await QRCode.toDataURL(result.paymentLink);
        setQrCode(qr);
        
        toast.success("PayPal invoice created and sent!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create PayPal invoice");
    } finally {
      setLoading(null);
    }
  };

  const copyToClipboard = () => {
    if (paymentLink) {
      navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      toast.success("Payment link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Payment Processing
        </CardTitle>
        <CardDescription>
          Generate payment links for invoice {invoiceNumber}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Amount */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Amount Due</p>
          <p className="text-2xl font-bold">
            {currency} {total.toFixed(2)}
          </p>
        </div>

        {/* Payment Method Selection */}
        {!paymentLink && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Select Payment Method</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleStripePayment}
                disabled={loading !== null}
                className="w-full"
              >
                {loading === "stripe" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Stripe
              </Button>
              <Button
                onClick={handlePayPalPayment}
                disabled={loading !== null}
                variant="outline"
                className="w-full"
              >
                {loading === "paypal" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <DollarSign className="h-4 w-4 mr-2" />
                )}
                PayPal
              </Button>
            </div>
          </div>
        )}

        {/* Payment Link Display */}
        {paymentLink && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="default">Payment Link Generated</Badge>
            </div>

            {/* QR Code */}
            {qrCode && (
              <div className="flex justify-center p-4 bg-white rounded-lg border">
                <img src={qrCode} alt="Payment QR Code" className="w-48 h-48" />
              </div>
            )}

            {/* Link with Copy Button */}
            <div className="flex gap-2">
              <input
                type="text"
                value={paymentLink}
                readOnly
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Instructions */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
              <p className="font-medium mb-1">Payment Instructions:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Share the payment link with {clientEmail}</li>
                <li>Client can scan the QR code to pay instantly</li>
                <li>Payment status will update automatically</li>
              </ul>
            </div>

            <Button
              onClick={() => window.open(paymentLink, "_blank")}
              className="w-full"
            >
              Open Payment Page
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
