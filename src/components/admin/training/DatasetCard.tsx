import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

interface Dataset {
  _id: string;
  title: string;
  sourceType: string;
  sourceUrl?: string;
  noteText?: string;
  linkedAgentKeys: string[];
  status: string;
  createdAt: number;
}

interface DatasetCardProps {
  dataset: Dataset;
  onUnlink?: (id: string) => void;
  onLink?: (id: string) => void;
  showLinkButton?: boolean;
}

export function DatasetCard({ dataset, onUnlink, onLink, showLinkButton }: DatasetCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{dataset.title}</CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">{dataset.sourceType}</Badge>
              {dataset.status && (
                <Badge variant={dataset.status === "new" ? "secondary" : "default"}>
                  {dataset.status}
                </Badge>
              )}
              {showLinkButton && (
                <Badge variant="secondary">
                  Used by {dataset.linkedAgentKeys.length} agent(s)
                </Badge>
              )}
            </div>
          </div>
          {onUnlink && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onUnlink(dataset._id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {onLink && showLinkButton && (
            <Button
              size="sm"
              onClick={() => onLink(dataset._id)}
            >
              Link
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {dataset.sourceUrl && (
          <p className="text-sm text-muted-foreground truncate">
            {dataset.sourceUrl}
          </p>
        )}
        {dataset.noteText && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {dataset.noteText}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Added {new Date(dataset.createdAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}
