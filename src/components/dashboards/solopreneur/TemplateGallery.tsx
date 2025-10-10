import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Search, Pin, TrendingUp, Clock } from "lucide-react";

interface TemplateGalleryProps {
  businessId: Id<"businesses">;
  userId: Id<"users">;
  tier: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseTemplate: (templateId: string) => void;
}

export function TemplateGallery({ businessId, userId, tier, open, onOpenChange, onUseTemplate }: TemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string | undefined>(undefined);

  const templates = useQuery(
    api.workflowTemplates.listTemplatesWithSmartOrdering,
    { businessId, userId, tier, category: categoryFilter, search: searchQuery, limit: 20 }
  );

  const categories = ["content", "sales", "operations", "finance", "marketing"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Template Gallery</DialogTitle>
          <DialogDescription>
            Browse and use workflow templates tailored to your needs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={categoryFilter === undefined ? "default" : "outline"}
              onClick={() => setCategoryFilter(undefined)}
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={categoryFilter === cat ? "default" : "outline"}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </div>

          <div className="grid gap-3">
            {templates?.map((template: any) => (
              <Card key={template._id} className="hover:border-primary transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {template.name}
                        {template._isPinned && <Pin className="h-3 w-3 fill-current" />}
                        {template._isNew && <Badge variant="secondary" className="text-xs">New</Badge>}
                        {template._usageCount > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {template._usageCount}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {template.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2 flex-wrap">
                      {template.tags?.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        onUseTemplate(template._id);
                        onOpenChange(false);
                      }}
                    >
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {templates?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No templates found. Try adjusting your search or filters.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
