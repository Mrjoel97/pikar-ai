import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Radio, TrendingUp, AlertCircle, MessageSquare } from "lucide-react";
import { useState } from "react";

export function SocialListening({ businessId }: { businessId: string }) {
  const [keywords, setKeywords] = useState<string[]>(["brand", "product", "service"]);
  const [newKeyword, setNewKeyword] = useState("");

  const mentions = [
    { id: 1, platform: "twitter", author: "@user1", content: "Love this product!", sentiment: "positive", time: "2m ago" },
    { id: 2, platform: "facebook", author: "User Two", content: "Having issues with...", sentiment: "negative", time: "5m ago" },
    { id: 3, platform: "instagram", author: "@user3", content: "Great service!", sentiment: "positive", time: "12m ago" },
  ];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "bg-green-100 text-green-700";
      case "negative": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Real-time Social Listening
          </CardTitle>
          <CardDescription>Monitor brand mentions across all platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add keyword to monitor..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
              />
              <Button onClick={() => {
                if (newKeyword) {
                  setKeywords([...keywords, newKeyword]);
                  setNewKeyword("");
                }
              }}>
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, idx) => (
                <Badge key={idx} variant="outline">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Live Mention Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {mentions.map((mention) => (
                <div key={mention.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{mention.platform}</Badge>
                      <span className="text-sm font-medium">{mention.author}</span>
                    </div>
                    <Badge className={getSentimentColor(mention.sentiment)}>
                      {mention.sentiment}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{mention.content}</p>
                  <span className="text-xs text-muted-foreground">{mention.time}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
