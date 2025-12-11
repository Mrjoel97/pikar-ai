import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Send, Mail } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface CapsuleLibraryProps {
  capsules: any[] | undefined;
  onDelete: (capsuleId: Id<"contentCapsules">) => void;
  onPublish?: (capsuleId: Id<"contentCapsules">) => void;
  onSendEmail?: (capsuleId: Id<"contentCapsules">, email: string) => void;
}

export function CapsuleLibrary({ capsules, onDelete, onPublish, onSendEmail }: CapsuleLibraryProps) {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedCapsule, setSelectedCapsule] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");

  const handleSendEmail = () => {
    if (selectedCapsule && recipientEmail && onSendEmail) {
      onSendEmail(selectedCapsule as Id<"contentCapsules">, recipientEmail);
      setEmailDialogOpen(false);
      setRecipientEmail("");
      setSelectedCapsule(null);
    }
  };

  return (
    <div className="grid gap-4">
      {capsules && capsules.length > 0 ? (
        capsules.map((cap: any) => (
          <Card key={cap._id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{cap.title}</CardTitle>
                  <CardDescription>
                    {new Date(cap._creationTime).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      cap.status === "published"
                        ? "default"
                        : cap.status === "scheduled"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {cap.status}
                  </Badge>
                  {cap.status === "draft" && onPublish && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => onPublish(cap._id)}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Publish
                    </Button>
                  )}
                  {onSendEmail && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCapsule(cap._id);
                        setEmailDialogOpen(true);
                      }}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(cap._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {cap.platforms.map((p: string) => (
                  <Badge key={p} variant="secondary">
                    {p}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No content capsules yet. Create your first one!
          </CardContent>
        </Card>
      )}

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Capsule via Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Recipient Email</label>
              <Input
                type="email"
                placeholder="recipient@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
            <Button onClick={handleSendEmail} className="w-full">
              Send Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}