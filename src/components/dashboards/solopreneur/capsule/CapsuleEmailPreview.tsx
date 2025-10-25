import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";

interface CapsuleEmailPreviewProps {
  emailSubject: string;
  emailBody: string;
  onSubjectChange: (subject: string) => void;
  onBodyChange: (body: string) => void;
  onCopy: (text: string, message: string) => void;
}

export function CapsuleEmailPreview({
  emailSubject,
  emailBody,
  onSubjectChange,
  onBodyChange,
  onCopy,
}: CapsuleEmailPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Email Campaign</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs">Subject Line</Label>
          <Input
            value={emailSubject}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Email Body</Label>
          <Textarea
            value={emailBody}
            onChange={(e) => onBodyChange(e.target.value)}
            rows={10}
            className="mt-1"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            onCopy(`${emailSubject}\n\n${emailBody}`, "Copied email")
          }
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy Email
        </Button>
      </CardContent>
    </Card>
  );
}
