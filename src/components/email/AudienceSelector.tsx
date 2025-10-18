import React from "react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Users, Plus } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface AudienceSelectorProps {
  audienceType: "direct" | "list";
  setAudienceType: (type: "direct" | "list") => void;
  directRecipients: string;
  setDirectRecipients: (value: string) => void;
  selectedListId: Id<"contactLists"> | null;
  setSelectedListId: (id: Id<"contactLists"> | null) => void;
  contactLists: any[] | undefined;
  selectedList: any;
  recipientCount: string | number;
  onOpenCsvDialog: () => void;
}

export function AudienceSelector({
  audienceType,
  setAudienceType,
  directRecipients,
  setDirectRecipients,
  selectedListId,
  setSelectedListId,
  contactLists,
  selectedList,
  recipientCount,
  onOpenCsvDialog,
}: AudienceSelectorProps) {
  return (
    <div className="space-y-4">
      <Label>Audience</Label>
      <Tabs value={audienceType} onValueChange={(value) => setAudienceType(value as "direct" | "list")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="direct" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Direct Recipients
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Contact List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="direct" className="space-y-2">
          <Textarea
            value={directRecipients}
            onChange={(e) => setDirectRecipients(e.target.value)}
            placeholder="Enter email addresses separated by commas"
            rows={3}
          />
          <p className="text-sm text-muted-foreground">
            Recipients: {recipientCount}
          </p>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={selectedListId || ""} onValueChange={(value) => setSelectedListId(value as Id<"contactLists">)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a contact list" />
              </SelectTrigger>
              <SelectContent>
                {contactLists?.map((list: any) => (
                  <SelectItem key={list._id} value={list._id}>
                    {list.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={onOpenCsvDialog}>
              <Plus className="h-4 w-4 mr-1" />
              Import CSV
            </Button>
          </div>

          {selectedList && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">{selectedList.name}</span>
                  <Badge variant="secondary">
                    {selectedList.description}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
