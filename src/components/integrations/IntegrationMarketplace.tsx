import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Star, TrendingUp, Zap } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface IntegrationMarketplaceProps {
  businessId: Id<"businesses">;
  tier: string;
  isGuest?: boolean;
}

interface AvailableIntegration {
  id: string;
  name: string;
  category: string;
  description: string;
  features: string[];
  difficulty: "easy" | "medium" | "advanced";
  popular: boolean;
  recommended: boolean;
  tierRequired: string;
  icon: string;
}

export function IntegrationMarketplace({ businessId, tier, isGuest = false }: IntegrationMarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const availableIntegrations: AvailableIntegration[] = [
    {
      id: "salesforce",
      name: "Salesforce",
      category: "crm",
      description: "Sync contacts, leads, and opportunities with Salesforce CRM",
      features: ["Bi-directional sync", "Custom field mapping", "Real-time updates"],
      difficulty: "medium",
      popular: true,
      recommended: true,
      tierRequired: "startup",
      icon: "🔷",
    },
    {
      id: "hubspot",
      name: "HubSpot",
      category: "crm",
      description: "Connect with HubSpot for marketing automation and CRM",
      features: ["Contact sync", "Deal tracking", "Email campaigns"],
      difficulty: "easy",
      popular: true,
      recommended: true,
      tierRequired: "startup",
      icon: "🟠",
    },
    {
      id: "slack",
      name: "Slack",
      category: "communication",
      description: "Send notifications and alerts to Slack channels",
      features: ["Workflow notifications", "Custom webhooks", "Bot integration"],
      difficulty: "easy",
      popular: true,
      recommended: false,
      tierRequired: "sme",
      icon: "💬",
    },
    {
      id: "google-analytics",
      name: "Google Analytics",
      category: "analytics",
      description: "Track user behavior and campaign performance",
      features: ["Event tracking", "Custom dimensions", "Goal tracking"],
      difficulty: "medium",
      popular: true,
      recommended: true,
      tierRequired: "sme",
      icon: "📊",
    },
    {
      id: "stripe",
      name: "Stripe",
      category: "payment",
      description: "Process payments and manage subscriptions",
      features: ["Payment processing", "Subscription management", "Webhook events"],
      difficulty: "medium",
      popular: true,
      recommended: false,
      tierRequired: "startup",
      icon: "💳",
    },
    {
      id: "sendgrid",
      name: "SendGrid",
      category: "email",
      description: "Advanced email delivery and analytics",
      features: ["Transactional emails", "Email templates", "Delivery analytics"],
      difficulty: "easy",
      popular: false,
      recommended: false,
      tierRequired: "startup",
      icon: "📧",
    },
    {
      id: "zapier",
      name: "Zapier",
      category: "automation",
      description: "Connect with 5000+ apps through Zapier",
      features: ["Multi-step workflows", "Conditional logic", "Custom triggers"],
      difficulty: "advanced",
      popular: true,
      recommended: true,
      tierRequired: "sme",
      icon: "⚡",
    },
    {
      id: "microsoft-teams",
      name: "Microsoft Teams",
      category: "communication",
      description: "Collaborate with team notifications in Microsoft Teams",
      features: ["Channel notifications", "Bot commands", "File sharing"],
      difficulty: "easy",
      popular: false,
      recommended: false,
      tierRequired: "sme",
      icon: "👥",
    },
  ];

  const categories = [
    { id: "all", label: "All Categories", icon: "📦" },
    { id: "crm", label: "CRM", icon: "👥" },
    { id: "communication", label: "Communication", icon: "💬" },
    { id: "analytics", label: "Analytics", icon: "📊" },
    { id: "email", label: "Email", icon: "📧" },
    { id: "payment", label: "Payment", icon: "💳" },
    { id: "automation", label: "Automation", icon: "⚡" },
  ];

  const filteredIntegrations = availableIntegrations.filter((integration) => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleConnect = (integration: AvailableIntegration) => {
    if (isGuest) {
      toast.info("Sign in to connect integrations");
      return;
    }

    const tierRank: Record<string, number> = { solopreneur: 1, startup: 2, sme: 3, enterprise: 4 };
    const currentTierRank = tierRank[tier.toLowerCase()] || 1;
    const requiredTierRank = tierRank[integration.tierRequired] || 1;

    if (currentTierRank < requiredTierRank) {
      toast.error(`This integration requires ${integration.tierRequired} tier or higher`);
      return;
    }

    toast.info(`Connecting to ${integration.name}...`);
    // In production, this would open OAuth flow or configuration dialog
  };

  const getDifficultyBadge = (difficulty: string) => {
    const colors = {
      easy: "border-green-300 text-green-700",
      medium: "border-amber-300 text-amber-700",
      advanced: "border-red-300 text-red-700",
    };
    return (
      <Badge variant="outline" className={colors[difficulty as keyof typeof colors]}>
        {difficulty}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Marketplace</CardTitle>
          <CardDescription>
            Discover and connect with powerful integrations to extend your platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
          >
            <span className="mr-2">{category.icon}</span>
            {category.label}
          </Button>
        ))}
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIntegrations.map((integration) => (
          <Card key={integration.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{integration.icon}</div>
                    <div>
                      <h3 className="font-semibold">{integration.name}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{integration.category}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {integration.popular && (
                      <Badge variant="outline" className="border-purple-300 text-purple-700">
                        <Star className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                    {integration.recommended && (
                      <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Recommended
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground">{integration.description}</p>

                {/* Features */}
                <div className="space-y-1">
                  {integration.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <Zap className="h-3 w-3 text-emerald-600" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t">
                  {getDifficultyBadge(integration.difficulty)}
                  <Button size="sm" onClick={() => handleConnect(integration)}>
                    Connect
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredIntegrations.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium mb-2">No integrations found</p>
          <p className="text-sm">Try adjusting your search or category filter</p>
        </div>
      )}
    </div>
  );
}
