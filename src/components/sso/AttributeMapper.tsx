import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Plus, Trash2 } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface AttributeMapperProps {
  businessId: Id<"businesses">;
}

export function AttributeMapper({ businessId }: AttributeMapperProps) {
  const samlConfigs = useQuery(api.saml.listSAMLConfigs, { businessId });
  const oidcConfigs = useQuery(api.oidc.listOIDCConfigs, { businessId });

  const [selectedConfigId, setSelectedConfigId] = useState<string>("");
  const [selectedType, setSelectedType] = useState<"saml" | "oidc">("saml");

  const allConfigs = [
    ...(samlConfigs?.map((c) => ({ ...c, type: "saml" as const })) || []),
    ...(oidcConfigs?.map((c) => ({ ...c, type: "oidc" as const })) || []),
  ];

  const selectedConfig = allConfigs.find((c) => c._id === selectedConfigId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Attribute Mapping</CardTitle>
          <CardDescription>
            Map identity provider attributes to internal user fields
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Identity Provider</Label>
            <Select
              value={selectedConfigId}
              onValueChange={(value) => {
                setSelectedConfigId(value);
                const config = allConfigs.find((c) => c._id === value);
                if (config) setSelectedType(config.type);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose an identity provider" />
              </SelectTrigger>
              <SelectContent>
                {allConfigs.map((config) => (
                  <SelectItem key={config._id} value={config._id}>
                    {config.name} ({config.type.toUpperCase()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedConfig && (
            <AttributeMappingEditor
              config={selectedConfig}
              type={selectedType}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AttributeMappingEditor({ config, type }: any) {
  const updateSAML = useMutation(api.saml.updateSAMLConfig);
  const updateOIDC = useMutation(api.oidc.updateOIDCConfig);

  const [mappings, setMappings] = useState<Record<string, string>>(
    config.attributeMapping || {
      email: type === "saml" ? "email" : "email",
      firstName: type === "saml" ? "firstName" : "given_name",
      lastName: type === "saml" ? "lastName" : "family_name",
      displayName: type === "saml" ? "displayName" : "name",
    }
  );

  const [customMappings, setCustomMappings] = useState<Array<{ key: string; value: string }>>([]);

  const handleSave = async () => {
    try {
      const allMappings = { ...mappings };
      customMappings.forEach((cm) => {
        if (cm.key && cm.value) {
          allMappings[cm.key] = cm.value;
        }
      });

      if (type === "saml") {
        await updateSAML({
          configId: config._id,
          attributeMapping: allMappings,
        });
      } else {
        await updateOIDC({
          configId: config._id,
          attributeMapping: allMappings,
        });
      }
      toast.success("Attribute mapping saved successfully");
    } catch (error: any) {
      toast.error(`Failed to save: ${error.message}`);
    }
  };

  const addCustomMapping = () => {
    setCustomMappings([...customMappings, { key: "", value: "" }]);
  };

  const removeCustomMapping = (index: number) => {
    setCustomMappings(customMappings.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="space-y-3">
        <h3 className="font-semibold">Standard Mappings</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={mappings.email || ""}
              onChange={(e) => setMappings({ ...mappings, email: e.target.value })}
              placeholder="IdP attribute name"
            />
          </div>
          <div className="space-y-2">
            <Label>First Name</Label>
            <Input
              value={mappings.firstName || ""}
              onChange={(e) => setMappings({ ...mappings, firstName: e.target.value })}
              placeholder="IdP attribute name"
            />
          </div>
          <div className="space-y-2">
            <Label>Last Name</Label>
            <Input
              value={mappings.lastName || ""}
              onChange={(e) => setMappings({ ...mappings, lastName: e.target.value })}
              placeholder="IdP attribute name"
            />
          </div>
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input
              value={mappings.displayName || ""}
              onChange={(e) => setMappings({ ...mappings, displayName: e.target.value })}
              placeholder="IdP attribute name"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Custom Mappings</h3>
          <Button variant="outline" size="sm" onClick={addCustomMapping}>
            <Plus className="h-4 w-4 mr-1" />
            Add Mapping
          </Button>
        </div>

        {customMappings.map((mapping, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder="Internal field"
              value={mapping.key}
              onChange={(e) => {
                const updated = [...customMappings];
                updated[index].key = e.target.value;
                setCustomMappings(updated);
              }}
            />
            <Input
              placeholder="IdP attribute"
              value={mapping.value}
              onChange={(e) => {
                const updated = [...customMappings];
                updated[index].value = e.target.value;
                setCustomMappings(updated);
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeCustomMapping(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button onClick={handleSave} className="w-full">
        <Save className="h-4 w-4 mr-2" />
        Save Attribute Mapping
      </Button>
    </div>
  );
}
