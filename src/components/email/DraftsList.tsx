import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, Trash2, Edit, Send } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

interface DraftsListProps {
  businessId: Id<"businesses">;
  onSelectDraft?: (draftId: Id<"emailDrafts">) => void;
  onSendDraft?: (draft: any) => void;
}

export function DraftsList({ businessId, onSelectDraft, onSendDraft }: DraftsListProps) {
  const drafts = useQuery(api.emailDrafts.listDrafts, { 
    businessId, 
    status: "draft",
    limit: 20 
  });
  const deleteDraft = useMutation(api.emailDrafts.deleteDraft);

  const handleDelete = async (draftId: Id<"emailDrafts">, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await deleteDraft({ draftId });
      toast.success("Draft deleted");
    } catch (error: any) {
      toast.error(`Failed to delete draft: ${error.message}`);
    }
  };

  const handleEdit = (draftId: Id<"emailDrafts">, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectDraft?.(draftId);
  };

  const handleSend = (draft: any, e: React.MouseEvent) => {
    e.stopPropagation();
    onSendDraft?.(draft);
  };

  if (!drafts || drafts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Drafts</CardTitle>
          <CardDescription>No drafts yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Create your first AI-generated email draft to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Drafts</CardTitle>
        <CardDescription>{drafts.length} draft(s)</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {drafts.map((draft: any) => (
              <Card 
                key={draft._id} 
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => onSelectDraft?.(draft._id)}
              >
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {draft.recipientEmail}
                          </span>
                        </div>
                        <p className="text-sm font-semibold truncate">
                          {draft.subject}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {draft.body}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {draft.tone && (
                          <Badge variant="secondary" className="text-xs">
                            {draft.tone}
                          </Badge>
                        )}
                        {draft.metadata?.aiGenerated && (
                          <Badge variant="outline" className="text-xs">
                            AI
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleEdit(draft._id, e)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleSend(draft, e)}
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(draft._id, e)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {new Date(draft.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
