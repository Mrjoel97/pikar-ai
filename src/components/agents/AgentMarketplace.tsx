import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, Star, Download, TrendingUp } from "lucide-react";

export function AgentMarketplace() {
  // Placeholder - will be implemented with actual marketplace listings
  const mockListings = [
    {
      id: "1",
      title: "Content Creation Expert",
      description: "Specialized in creating engaging social media content",
      category: "Marketing",
      price: 49,
      rating: 4.8,
      downloads: 1234,
    },
    {
      id: "2",
      title: "Data Analysis Pro",
      description: "Advanced analytics and reporting capabilities",
      category: "Analytics",
      price: 99,
      rating: 4.9,
      downloads: 856,
    },
    {
      id: "3",
      title: "Customer Support Assistant",
      description: "24/7 customer support automation",
      category: "Support",
      price: 79,
      rating: 4.7,
      downloads: 2103,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Agent Marketplace
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockListings.map((listing) => (
              <Card key={listing.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{listing.title}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {listing.category}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">${listing.price}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{listing.description}</p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{listing.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Download className="h-4 w-4" />
                      <span>{listing.downloads.toLocaleString()}</span>
                    </div>
                  </div>

                  <Button className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Install Agent
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending Agents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Discover the most popular AI agents in the marketplace
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
