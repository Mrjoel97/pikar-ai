import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Building2, MapPin, Plus, Edit, Trash2 } from "lucide-react";

interface LocationManagerProps {
  businessId: Id<"businesses">;
}

export function LocationManager({ businessId }: LocationManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const locations = useQuery(api.locations.management.getLocations, { businessId });
  const createLocation = useMutation(api.locations.management.createLocation);
  const updateLocation = useMutation(api.locations.management.updateLocation);
  const deleteLocation = useMutation(api.locations.management.deleteLocation);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "office" as "headquarters" | "branch" | "warehouse" | "retail" | "office",
    street: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    timezone: "UTC",
    manager: "",
    contactEmail: "",
    contactPhone: "",
  });

  const handleCreate = async () => {
    try {
      await createLocation({
        businessId,
        name: formData.name,
        code: formData.code,
        type: formData.type,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postalCode: formData.postalCode,
        },
        timezone: formData.timezone,
        manager: formData.manager || undefined,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined,
      });
      toast.success("Location created successfully");
      setIsCreateOpen(false);
      setFormData({
        name: "",
        code: "",
        type: "office",
        street: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
        timezone: "UTC",
        manager: "",
        contactEmail: "",
        contactPhone: "",
      });
    } catch (error) {
      toast.error("Failed to create location");
    }
  };

  if (!locations) {
    return <div>Loading locations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Location Management</h2>
          <p className="text-muted-foreground">Manage your business locations</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Location</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Location Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Main Office"
                  />
                </div>
                <div>
                  <Label>Location Code</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="HQ-001"
                  />
                </div>
              </div>

              <div>
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="headquarters">Headquarters</SelectItem>
                    <SelectItem value="branch">Branch</SelectItem>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Street Address</Label>
                <Input
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="123 Main St"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="San Francisco"
                  />
                </div>
                <div>
                  <Label>State/Province</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="CA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Country</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="USA"
                  />
                </div>
                <div>
                  <Label>Postal Code</Label>
                  <Input
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="94102"
                  />
                </div>
              </div>

              <div>
                <Label>Timezone</Label>
                <Input
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  placeholder="America/Los_Angeles"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Manager</Label>
                  <Input
                    value={formData.manager}
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label>Contact Email</Label>
                  <Input
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="contact@example.com"
                  />
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+1 555-0100"
                  />
                </div>
              </div>

              <Button onClick={handleCreate} className="w-full">
                Create Location
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {locations.map((location) => (
          <Card key={location._id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-lg">{location.name}</CardTitle>
                    <CardDescription>{location.code}</CardDescription>
                  </div>
                </div>
                <Badge variant={location.isActive ? "default" : "secondary"}>
                  {location.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div>{location.address.street}</div>
                    <div>
                      {location.address.city}, {location.address.state} {location.address.postalCode}
                    </div>
                    <div>{location.address.country}</div>
                  </div>
                </div>
                {location.manager && (
                  <div className="text-muted-foreground">Manager: {location.manager}</div>
                )}
                <Badge variant="outline" className="capitalize">
                  {location.type}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {locations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No locations yet</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Location
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
