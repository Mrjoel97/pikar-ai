import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables?: string[];
  category?: string;
}

interface AgentPromptTemplatesProps {
  agentKey: string;
  agentName: string;
  templates?: PromptTemplate[];
}

export function AgentPromptTemplates({ agentKey, agentName, templates = [] }: AgentPromptTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  // Default templates if none provided
  const defaultTemplates: PromptTemplate[] = [
    {
      id: "content-creation",
      name: "Content Creation",
      description: "Generate engaging content for social media or blog posts",
      template: "Create a {tone} {content_type} about {topic} for {audience}. Include {key_points} and make it {length}.",
      variables: ["tone", "content_type", "topic", "audience", "key_points", "length"],
      category: "Content"
    },
    {
      id: "data-analysis",
      name: "Data Analysis",
      description: "Analyze data and provide insights",
      template: "Analyze the following {data_type} data and provide insights on {focus_area}. Include trends, patterns, and actionable recommendations.",
      variables: ["data_type", "focus_area"],
      category: "Analytics"
    },
    {
      id: "customer-support",
      name: "Customer Support",
      description: "Handle customer inquiries professionally",
      template: "Respond to this customer inquiry about {issue} with a {tone} tone. Provide {solution_type} and ensure customer satisfaction.",
      variables: ["issue", "tone", "solution_type"],
      category: "Support"
    },
    {
      id: "email-draft",
      name: "Email Draft",
      description: "Draft professional emails",
      template: "Draft a {formality} email to {recipient} about {subject}. The purpose is to {purpose} and the tone should be {tone}.",
      variables: ["formality", "recipient", "subject", "purpose", "tone"],
      category: "Communication"
    },
    {
      id: "report-generation",
      name: "Report Generation",
      description: "Generate comprehensive reports",
      template: "Generate a {report_type} report covering {time_period}. Focus on {metrics} and include {sections}. Format: {format}.",
      variables: ["report_type", "time_period", "metrics", "sections", "format"],
      category: "Reporting"
    }
  ];

  const availableTemplates = templates.length > 0 ? templates : defaultTemplates;

  const handleTemplateSelect = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    setGeneratedPrompt("");
    // Initialize variable values
    const initialValues: Record<string, string> = {};
    template.variables?.forEach(v => {
      initialValues[v] = "";
    });
    setVariableValues(initialValues);
  };

  const handleGeneratePrompt = () => {
    if (!selectedTemplate) return;

    let prompt = selectedTemplate.template;
    
    // Replace variables with values
    selectedTemplate.variables?.forEach(variable => {
      const value = variableValues[variable] || `[${variable}]`;
      prompt = prompt.replace(new RegExp(`{${variable}}`, 'g'), value);
    });

    setGeneratedPrompt(prompt);
    toast.success("Prompt generated successfully!");
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    toast.success("Prompt copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Prompt Templates for {agentName}</h3>
        <p className="text-sm text-muted-foreground">
          Select a template and customize it to create effective prompts for your agent
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableTemplates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTemplate?.id === template.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => handleTemplateSelect(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {template.description}
                  </CardDescription>
                </div>
                {template.category && (
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {template.template}
              </p>
              {template.variables && template.variables.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {template.variables.map((v) => (
                    <Badge key={v} variant="secondary" className="text-xs">
                      {v}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Customize Template: {selectedTemplate.name}
            </CardTitle>
            <CardDescription>
              Fill in the variables to generate your custom prompt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedTemplate.variables?.map((variable) => (
                <div key={variable} className="space-y-2">
                  <Label htmlFor={variable} className="capitalize">
                    {variable.replace(/_/g, " ")}
                  </Label>
                  <Input
                    id={variable}
                    placeholder={`Enter ${variable.replace(/_/g, " ")}`}
                    value={variableValues[variable] || ""}
                    onChange={(e) =>
                      setVariableValues({ ...variableValues, [variable]: e.target.value })
                    }
                  />
                </div>
              ))}
            </div>

            <Button onClick={handleGeneratePrompt} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Prompt
            </Button>

            {generatedPrompt && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Generated Prompt</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyPrompt}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  value={generatedPrompt}
                  onChange={(e) => setGeneratedPrompt(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
