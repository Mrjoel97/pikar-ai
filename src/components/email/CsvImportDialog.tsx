import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CsvContact {
  email: string;
  name?: string;
  tags?: string[];
}

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  csvText: string;
  onCsvTextChange: (text: string) => void;
  csvListName: string;
  onCsvListNameChange: (name: string) => void;
  csvPreview: CsvContact[];
  csvContacts: CsvContact[];
  onImport: () => void;
}

export function CsvImportDialog({
  open,
  onOpenChange,
  csvText,
  onCsvTextChange,
  csvListName,
  onCsvListNameChange,
  csvPreview,
  csvContacts,
  onImport,
}: CsvImportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Contacts from CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="csvListName">List Name</Label>
            <Input
              id="csvListName"
              value={csvListName}
              onChange={(e) => onCsvListNameChange(e.target.value)}
              placeholder="My Contact List"
            />
          </div>

          <div>
            <Label htmlFor="csvText">CSV Data</Label>
            <Textarea
              id="csvText"
              value={csvText}
              onChange={(e) => onCsvTextChange(e.target.value)}
              placeholder="email,name,tags&#10;john@example.com,John Doe,newsletter;customer&#10;jane@example.com,Jane Smith,newsletter"
              rows={8}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Expected format: email,name,tags (tags separated by semicolons)
            </p>
          </div>

          {csvPreview.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Preview ({csvContacts.length} contacts total)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {csvPreview.map((contact, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">{contact.email}</Badge>
                      {contact.name && <span>{contact.name}</span>}
                      {contact.tags && contact.tags.length > 0 && (
                        <div className="flex gap-1">
                          {contact.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onImport} disabled={csvContacts.length === 0 || !csvListName.trim()}>
              Import {csvContacts.length} Contacts
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
