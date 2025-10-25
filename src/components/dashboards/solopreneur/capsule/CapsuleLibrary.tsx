import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface CapsuleLibraryProps {
  capsules: any[] | undefined;
  onDelete: (capsuleId: Id<"contentCapsules">) => void;
}

export function CapsuleLibrary({ capsules, onDelete }: CapsuleLibraryProps) {
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
    </div>
  );
}
