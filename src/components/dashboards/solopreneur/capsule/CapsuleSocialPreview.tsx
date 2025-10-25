import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy } from "lucide-react";

interface CapsuleContent {
  tweets: string[];
  linkedinPost: string;
  facebookPost: string;
}

interface CapsuleSocialPreviewProps {
  capsule: CapsuleContent;
  setCapsule: (capsule: CapsuleContent) => void;
  platforms: Array<"twitter" | "linkedin" | "facebook">;
  onCopy: (text: string, message: string) => void;
}

export function CapsuleSocialPreview({
  capsule,
  setCapsule,
  platforms,
  onCopy,
}: CapsuleSocialPreviewProps) {
  return (
    <div className="space-y-4">
      {platforms.includes("twitter") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              𝕏 Twitter/X Posts
              <Badge variant="secondary">{capsule.tweets.length} variants</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {capsule.tweets.map((tweet, i) => (
              <div key={i}>
                <Label className="text-xs">Tweet {i + 1}</Label>
                <Textarea
                  value={tweet}
                  onChange={(e) => {
                    const newTweets = [...capsule.tweets];
                    newTweets[i] = e.target.value;
                    setCapsule({ ...capsule, tweets: newTweets });
                  }}
                  rows={3}
                  className="mt-1"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-muted-foreground">
                    {tweet.length}/280 characters
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onCopy(tweet, `Copied tweet ${i + 1}`)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {platforms.includes("linkedin") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">in LinkedIn Post</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={capsule.linkedinPost}
              onChange={(e) =>
                setCapsule({ ...capsule, linkedinPost: e.target.value })
              }
              rows={8}
              className="mb-2"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCopy(capsule.linkedinPost, "Copied LinkedIn post")}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </CardContent>
        </Card>
      )}

      {platforms.includes("facebook") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">f Facebook Post</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={capsule.facebookPost}
              onChange={(e) =>
                setCapsule({ ...capsule, facebookPost: e.target.value })
              }
              rows={8}
              className="mb-2"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCopy(capsule.facebookPost, "Copied Facebook post")}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
