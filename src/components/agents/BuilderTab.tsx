import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AgentBuilderForm } from "./AgentBuilderForm";
import { Plus, Sparkles } from "lucide-react";

export default function BuilderTab({ userId, selectedTier }: { userId?: Id<"users">; selectedTier: string }) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Id<"aiAgents"> | undefined>();

  const business = useQuery(api.businesses.getCurrentBusiness, userId ? { userId } : "skip");
  const templates = useQuery(api.aiAgents.listTemplates, {});

  if (!userId || !business) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agent Builder</CardTitle>
          <CardDescription>Sign in to start building AI agents</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (showBuilder) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Build Your Agent</h2>
          <Button variant="outline" onClick={() => setShowBuilder(false)}>
            Cancel
          </Button>
        </div>
        <AgentBuilderForm
          businessId={business._id}
          userId={userId}
          templateId={selectedTemplate}
          onSuccess={() => {
            setShowBuilder(false);
            setSelectedTemplate(undefined);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            Agent Builder
          </CardTitle>
          <CardDescription>
            Create custom AI agents or start from a template
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowBuilder(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Create New Agent
          </Button>
        </CardContent>
      </Card>

      {templates && templates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Start from a Template</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template: any) => (
              <Card key={template._id} className="cursor-pointer hover:border-emerald-600 transition-colors">
                <CardHeader>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(template._id);
                      setShowBuilder(true);
                    }}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}