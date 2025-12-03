import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Template {
  key: string;
  name: string;
  tag: string;
  description: string;
  prompt?: string;
}

interface TemplateGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: Template[];
  pinnedSet: Set<string>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onPinTemplate: (key: string, pinned: boolean) => void;
  onUseTemplate: (template: Template) => void;
}

export function TemplateGallery({
  open,
  onOpenChange,
  templates,
  pinnedSet,
  searchQuery,
  onSearchChange,
  onPinTemplate,
  onUseTemplate,
}: TemplateGalleryProps) {
  const filteredTemplates = React.useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.tag.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }, [templates, searchQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Template Gallery</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Search templates by name, tag, or description..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-auto pr-1">
            {filteredTemplates.map((t) => (
              <Card key={`gallery_${t.key}`}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{t.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {t.tag}
                      </Badge>
                      <Button
                        size="icon"
                        variant={pinnedSet.has(t.key) ? "default" : "outline"}
                        className={
                          pinnedSet.has(t.key)
                            ? "bg-emerald-600 text-white hover:bg-emerald-700 h-8 w-8"
                            : "h-8 w-8"
                        }
                        onClick={() => onPinTemplate(t.key, !pinnedSet.has(t.key))}
                        aria-label={
                          pinnedSet.has(t.key) ? "Unpin template" : "Pin template"
                        }
                        title={pinnedSet.has(t.key) ? "Unpin" : "Pin"}
                      >
                        {pinnedSet.has(t.key) ? "★" : "☆"}
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{t.description}</p>
                  <div className="pt-1">
                    <Button
                      size="sm"
                      className="bg-emerald-600 text-white hover:bg-emerald-700"
                      onClick={() => {
                        onUseTemplate(t);
                        onOpenChange(false);
                      }}
                    >
                      Use
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredTemplates.length === 0 && (
              <div className="text-sm text-muted-foreground p-2">
                No templates match your search.
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}