import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Globe, CheckCircle, XCircle, Copy } from "lucide-react";

interface DomainManagerProps {
  businessId: Id<"businesses">;
  brandId?: Id<"brands">;
}

export function DomainManager({ businessId, brandId }: DomainManagerProps) {
  const domains = useQuery(api.branding.getCustomDomains, { businessId, brandId });
  const configureDomain = useMutation(api.branding.configureCustomDomain);
  const verifyDomain = useMutation(api.branding.verifyDomain);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [domainInput, setDomainInput] = useState("");

  const handleAddDomain = async () => {
    if (!domainInput) {
      toast.error("Please enter a domain");
      return;
    }

    try {
      await configureDomain({
        businessId,
        brandId,
        domain: domainInput,
        sslEnabled: true,
      });
      toast.success("Domain configured successfully");
      setIsAddOpen(false);
      setDomainInput("");
    } catch (error: any) {
      toast.error(error.message || "Failed to configure domain");
    }
  };

  const handleVerify = async (domainId: Id<"customDomains">) => {
    try {
      await verifyDomain({ domainId });
      toast.success("Domain verified successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to verify domain");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Custom Domains</h3>
          <p className="text-sm text-muted-foreground">
            Configure custom domains for your brand
          </p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Globe className="mr-2 h-4 w-4" />
              Add Domain
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Domain</DialogTitle>
              <DialogDescription>
                Configure a custom domain for your brand
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="domain">Domain *</Label>
                <Input
                  id="domain"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="app.yourcompany.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDomain}>Add Domain</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {domains?.map((domain: any) => (
          <Card key={domain._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  <CardTitle className="text-lg">{domain.domain}</CardTitle>
                </div>
                <Badge variant={domain.verified ? "default" : "secondary"}>
                  {domain.verified ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Pending
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!domain.verified && (
                <>
                  <Alert>
                    <AlertDescription>
                      Add the following DNS record to verify your domain:
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2 p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Type</p>
                        <p className="text-sm text-muted-foreground">{domain.dnsRecords.type}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(domain.dnsRecords.type)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Name</p>
                        <p className="text-sm text-muted-foreground">{domain.dnsRecords.name}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(domain.dnsRecords.name)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Value</p>
                        <p className="text-sm text-muted-foreground">{domain.dnsRecords.value}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(domain.dnsRecords.value)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button onClick={() => handleVerify(domain._id)} className="w-full">
                    Verify Domain
                  </Button>
                </>
              )}
              {domain.verified && (
                <div className="text-sm text-muted-foreground">
                  Verified on {new Date(domain.verifiedAt!).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}