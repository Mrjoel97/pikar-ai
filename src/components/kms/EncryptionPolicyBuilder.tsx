import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Shield, Plus, Trash2, Edit } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface EncryptionPolicyBuilderProps {
  businessId: Id<"businesses">;
}

export function EncryptionPolicyBuilder({ businessId }: EncryptionPolicyBuilderProps) {
  const policies = useQuery(api.kms.getEncryptionPolicies, { businessId });
  const createPolicy = useMutation(api.kms.createEncryptionPolicy);
  const updatePolicy = useMutation(api.kms.updateEncryptionPolicy);
  const deletePolicy = useMutation(api.kms.deleteEncryptionPolicy);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetTables, setTargetTables] = useState("");
  const [targetFields, setTargetFields] = useState("");
  const [encryptionLevel, setEncryptionLevel] = useState<"field" | "record" | "table">("field");
  const [mandatory, setMandatory] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name || !targetTables || !targetFields) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      if (editingPolicy) {
        await updatePolicy({
          policyId: editingPolicy._id,
          name,
          description,
          targetTables: targetTables.split(",").map((t) => t.trim()),
          targetFields: targetFields.split(",").map((f) => f.trim()),
          encryptionLevel,
          mandatory,
        });
        toast.success("Policy updated successfully");
      } else {
        await createPolicy({
          businessId,
          name,
          description,
          targetTables: targetTables.split(",").map((t) => t.trim()),
          targetFields: targetFields.split(",").map((f) => f.trim()),
          encryptionLevel,
          mandatory,
        });
        toast.success("Policy created successfully");
      }
      resetForm();
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save policy");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (policy: any) => {
    setEditingPolicy(policy);
    setName(policy.name);
    setDescription(policy.description);
    setTargetTables(policy.targetTables.join(", "));
    setTargetFields(policy.targetFields.join(", "));
    setEncryptionLevel(policy.encryptionLevel);
    setMandatory(policy.mandatory);
    setDialogOpen(true);
  };

  const handleDelete = async (policyId: Id<"kmsEncryptionPolicies">) => {
    if (!confirm("Are you sure you want to delete this policy?")) return;

    try {
      await deletePolicy({ policyId });
      toast.success("Policy deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete policy");
    }
  };

  const resetForm = () => {
    setEditingPolicy(null);
    setName("");
    setDescription("");
    setTargetTables("");
    setTargetFields("");
    setEncryptionLevel("field");
    setMandatory(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Encryption Policies
              </CardTitle>
              <CardDescription>
                Define encryption rules for tables and fields
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Policy
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingPolicy ? "Edit Policy" : "Create Encryption Policy"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="policy-name">Policy Name *</Label>
                    <Input
                      id="policy-name"
                      placeholder="e.g., PII Data Encryption"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="policy-desc">Description</Label>
                    <Textarea
                      id="policy-desc"
                      placeholder="Describe the purpose of this policy..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target-tables">Target Tables * (comma-separated)</Label>
                    <Input
                      id="target-tables"
                      placeholder="e.g., users, contacts, customers"
                      value={targetTables}
                      onChange={(e) => setTargetTables(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target-fields">Target Fields * (comma-separated)</Label>
                    <Input
                      id="target-fields"
                      placeholder="e.g., email, phone, ssn, creditCard"
                      value={targetFields}
                      onChange={(e) => setTargetFields(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="encryption-level">Encryption Level</Label>
                    <select
                      id="encryption-level"
                      className="w-full p-2 border rounded-md"
                      value={encryptionLevel}
                      onChange={(e) => setEncryptionLevel(e.target.value as any)}
                    >
                      <option value="field">Field-Level (Most Secure)</option>
                      <option value="record">Record-Level</option>
                      <option value="table">Table-Level</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="mandatory">Mandatory Policy</Label>
                    <Switch
                      id="mandatory"
                      checked={mandatory}
                      onCheckedChange={setMandatory}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} disabled={saving} className="flex-1">
                      {saving ? "Saving..." : editingPolicy ? "Update Policy" : "Create Policy"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        resetForm();
                        setDialogOpen(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!policies || policies.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No encryption policies defined. Create one to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {policies.map((policy) => (
                <div
                  key={policy._id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{policy.name}</h4>
                      {policy.mandatory && (
                        <Badge variant="destructive">Mandatory</Badge>
                      )}
                      {policy.active ? (
                        <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>
                    {policy.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {policy.description}
                      </p>
                    )}
                    <div className="text-xs space-y-1">
                      <div>
                        <span className="font-medium">Tables:</span>{" "}
                        {policy.targetTables.join(", ")}
                      </div>
                      <div>
                        <span className="font-medium">Fields:</span>{" "}
                        {policy.targetFields.join(", ")}
                      </div>
                      <div>
                        <span className="font-medium">Level:</span>{" "}
                        {policy.encryptionLevel}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(policy)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(policy._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
