import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Globe, Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

export function DomainManager({ businessId }: { businessId: Id<"businesses"> }) {
  const domains = useQuery(api.whiteLabel.domains.getDomains, { businessId });
  const addDomain = useMutation(api.whiteLabel.domains.addDomain);
  const deleteDomain = useMutation(api.whiteLabel.domains.deleteDomain);
  const verifyDomain = useMutation(api.whiteLabel.domains.verifyDomain);

  const [newDomain, setNewDomain] = useState("");

  const handleAddDomain = async () => {
    if (!newDomain) {
      toast.error("Please enter a domain");
      return;
    }

    try {
      await addDomain({ businessId, domain: newDomain });
      setNewDomain("");
      toast.success("Domain added successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to add domain");
    }
  };

  const handleDeleteDomain = async (domainId: Id<"whiteLabelDomains">) => {
    try {
      await deleteDomain({ domainId });
      toast.success("Domain deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete domain");
    }
  };

  const handleVerifyDomain = async (domainId: Id<"whiteLabelDomains">) => {
    try {
      await verifyDomain({ domainId });
      toast.success("Domain verified");
    } catch (error: any) {
      toast.error(error.message || "Failed to verify domain");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Custom Domains
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="app.yourdomain.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
          />
          <Button onClick={handleAddDomain}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>

        <div className="space-y-2">
          {domains?.map((domain) => (
            <div
              key={domain._id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">{domain.domain}</span>
                {domain.verified ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Pending
                  </Badge>
                )}
                {domain.isPrimary && (
                  <Badge variant="outline">Primary</Badge>
                )}
              </div>
              <div className="flex gap-2">
                {!domain.verified && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleVerifyDomain(domain._id)}
                  >
                    Verify
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteDomain(domain._id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
