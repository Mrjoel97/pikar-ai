import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Hash, Plus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DepartmentChannelsProps {
  businessId: Id<"businesses">;
  onChannelSelect: (channelId: Id<"teamChannels">) => void;
}

export function DepartmentChannels({ businessId, onChannelSelect }: DepartmentChannelsProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [isCrossDepartment, setIsCrossDepartment] = useState(false);

  const departments = useQuery(api.teamChat.departments.getDepartmentSummary, { businessId });
  const crossDeptChannels = useQuery(api.teamChat.departments.getCrossDepartmentChannels, { businessId });
  const createChannel = useMutation(api.teamChat.departments.createDepartmentChannel);

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) {
      toast.error("Channel name is required");
      return;
    }

    try {
      await createChannel({
        businessId,
        name: newChannelName,
        department: isCrossDepartment ? "cross-department" : selectedDepartment,
        isPrivate: false,
        isCrossDepartment,
      });

      toast.success("Channel created successfully");
      setShowCreateDialog(false);
      setNewChannelName("");
      setSelectedDepartment("");
      setIsCrossDepartment(false);
    } catch (error) {
      toast.error("Failed to create channel");
      console.error(error);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Departments
            </CardTitle>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Channel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Department Channel</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="channelName">Channel Name</Label>
                    <Input
                      id="channelName"
                      placeholder="e.g., marketing-campaigns"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={selectedDepartment}
                      onValueChange={setSelectedDepartment}
                      disabled={isCrossDepartment}
                    >
                      <SelectTrigger id="department">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="engineering">Engineering</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="crossDept"
                      checked={isCrossDepartment}
                      onChange={(e) => setIsCrossDepartment(e.target.checked)}
                    />
                    <Label htmlFor="crossDept" className="cursor-pointer">
                      Cross-department channel
                    </Label>
                  </div>
                  <Button onClick={handleCreateChannel} className="w-full">
                    Create Channel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {departments?.map((dept: any) => (
            <div key={dept.name} className="p-3 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium capitalize">{dept.name}</span>
                </div>
                <Badge variant="secondary">{dept.channelCount} channels</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {crossDeptChannels && crossDeptChannels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Cross-Department Channels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {crossDeptChannels.map((channel: any) => (
                <Button
                  key={channel._id}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => onChannelSelect(channel._id)}
                >
                  <Hash className="h-4 w-4 mr-2" />
                  {channel.name}
                  <Badge variant="outline" className="ml-auto">
                    Cross-dept
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
