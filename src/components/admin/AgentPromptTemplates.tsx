import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Sparkles, Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RichTemplateEditor } from "./RichTemplateEditor";

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
}

export function AgentPromptTemplates({ agentKey, agentName }: AgentPromptTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<PromptTemplate>>({});
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedAgentKey, setSelectedAgentKey] = useState<string>(agentKey);

  // Fetch all agents for the dropdown
  const allAgents = useQuery(api.aiAgents.adminListAgents, {
    activeOnly: false,
    limit: 100,
  }) as Array<{
    agent_key: string;
    display_name: string;
  }> | undefined;

  // Fetch templates from database for the selected agent
  const templates = useQuery(api.aiAgents.getAgentPromptTemplates, { agent_key: selectedAgentKey }) as Array<PromptTemplate & {
    variableMetadata?: Record<string, { type: string; description: string; placeholder: string; options?: string[] }>;
  }> | undefined;
  const addTemplate = useMutation(api.aiAgents.addPromptTemplate);
  const updateTemplate = useMutation(api.aiAgents.updatePromptTemplate);
  const deleteTemplate = useMutation(api.aiAgents.deletePromptTemplate);

  const availableTemplates = templates || [];

  // Predefined category options
  const categoryOptions = [
    "Communication",
    "Content Creation",
    "Analysis",
    "Customer Service",
    "Marketing",
    "Sales",
    "Operations",
    "Technical",
    "Custom",
  ];

  const handleTemplateSelect = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    setGeneratedPrompt("");
    setPreviewMode(false);
    const initialValues: Record<string, string> = {};
    template.variables?.forEach(v => {
      initialValues[v] = "";
    });
    setVariableValues(initialValues);
  };

  const handleGeneratePrompt = () => {
    if (!selectedTemplate) return;

    let prompt = selectedTemplate.template;
    
    selectedTemplate.variables?.forEach(variable => {
      const value = variableValues[variable] || `[${variable}]`;
      prompt = prompt.replace(new RegExp(`{${variable}}`, 'g'), value);
    });

    setGeneratedPrompt(prompt);
    setPreviewMode(true);
    toast.success("Prompt generated successfully!");
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    toast.success("Prompt copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveTemplate = async () => {
    if (!newTemplate.name || !newTemplate.template) {
      toast.error("Please provide name and template");
      return;
    }

    try {
      if (editingTemplate) {
        await updateTemplate({
          agent_key: selectedAgentKey,
          templateId: editingTemplate.id,
          template: {
            name: newTemplate.name,
            description: newTemplate.description || "",
            template: newTemplate.template,
            variables: newTemplate.variables || [],
            category: newTemplate.category || "Custom",
          },
        });
        toast.success("Template updated successfully!");
      } else {
        await addTemplate({
          agent_key: selectedAgentKey,
          template: {
            id: `custom_${Date.now()}`,
            name: newTemplate.name,
            description: newTemplate.description || "",
            template: newTemplate.template,
            variables: newTemplate.variables || [],
            category: newTemplate.category || "Custom",
          },
        });
        toast.success("Template added successfully!");
      }
      setEditDialogOpen(false);
      setEditingTemplate(null);
      setNewTemplate({});
    } catch (error: any) {
      toast.error(error?.message || "Failed to save template");
    }
  };

  const handleOpenEditTemplate = (template: PromptTemplate) => {
    setEditingTemplate(template);
    setNewTemplate({
      name: template.name,
      description: template.description,
      template: template.template,
      variables: template.variables || [],
      category: template.category,
    });
    setEditDialogOpen(true);
  };

  const handleOpenAddTemplate = () => {
    setEditingTemplate(null);
    setNewTemplate({});
    setEditDialogOpen(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteTemplate({ agent_key: selectedAgentKey, templateId });
      toast.success("Template deleted successfully!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete template");
    }
  };

  const renderVariableInput = (variable: string, metadata: any) => {
    if (metadata.type === 'textarea') {
      return (
        <Textarea
          id={variable}
          placeholder={metadata.placeholder}
          value={variableValues[variable] || ""}
          onChange={(e) =>
            setVariableValues({ ...variableValues, [variable]: e.target.value })
          }
          rows={3}
        />
      );
    } else if (metadata.type === 'select' && metadata.options) {
      return (
        <select
          id={variable}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={variableValues[variable] || ""}
          onChange={(e) =>
            setVariableValues({ ...variableValues, [variable]: e.target.value })
          }
        >
          <option value="">{metadata.placeholder}</option>
          {metadata.options.map((opt: string) => (
            <option key={opt} value={opt}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </option>
          ))}
        </select>
      );
    } else {
      return (
        <Input
          id={variable}
          type={metadata.type}
          placeholder={metadata.placeholder}
          value={variableValues[variable] || ""}
          onChange={(e) =>
            setVariableValues({ ...variableValues, [variable]: e.target.value })
          }
        />
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">Prompt Templates</h3>
          <p className="text-sm text-muted-foreground">
            Select an agent and template to create effective prompts
          </p>
        </div>
        <Button size="sm" onClick={handleOpenAddTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </div>

      {/* Agent Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label>Select Agent</Label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={selectedAgentKey}
              onChange={(e) => {
                setSelectedAgentKey(e.target.value);
                setSelectedTemplate(null);
                setGeneratedPrompt("");
                setPreviewMode(false);
              }}
            >
              <option value={agentKey}>{agentName} (Current)</option>
              {allAgents?.filter(a => a.agent_key !== agentKey).map((agent) => (
                <option key={agent.agent_key} value={agent.agent_key}>
                  {agent.display_name || agent.agent_key}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

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
                <div className="flex-1">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {template.description}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {template.category && (
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                  )}
                  {template.id.startsWith('custom_') && (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditTemplate(template);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
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
            {!previewMode ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTemplate.variables?.map((variable) => {
                    const metadata = (selectedTemplate as any).variableMetadata?.[variable] || {
                      type: 'text',
                      description: variable.replace(/_/g, ' '),
                      placeholder: `Enter ${variable.replace(/_/g, ' ')}`,
                    };
                    
                    return (
                      <div key={variable} className="space-y-2">
                        <Label htmlFor={variable} className="capitalize">
                          {variable.replace(/_/g, " ")}
                        </Label>
                        <p className="text-xs text-muted-foreground">{metadata.description}</p>
                        {renderVariableInput(variable, metadata)}
                      </div>
                    );
                  })}
                </div>

                <Button onClick={handleGeneratePrompt} className="w-full">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Prompt
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Generated Prompt</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewMode(false)}
                    >
                      Edit Variables
                    </Button>
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
                </div>
                <Textarea
                  value={generatedPrompt}
                  onChange={(e) => setGeneratedPrompt(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          setEditingTemplate(null);
          setNewTemplate({});
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit" : "Add"} Prompt Template</DialogTitle>
            <DialogDescription>
              {editingTemplate ? "Update the" : "Create a new"} prompt template for this agent
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                placeholder="e.g., Email Response"
                value={newTemplate.name || ""}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Brief description"
                value={newTemplate.description || ""}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={newTemplate.category || ""}
                onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
              >
                <option value="">Select a category...</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Template (use {"{variable}"} for placeholders)</Label>
              <RichTemplateEditor
                value={newTemplate.template || ""}
                onChange={(template) => setNewTemplate({ ...newTemplate, template })}
                placeholder="Write a {tone} email about {subject}..."
                rows={8}
                variables={newTemplate.variables || []}
              />
              <p className="text-xs text-muted-foreground">
                Tip: Use descriptive variable names like {"{tone}"}, {"{priority}"}, {"{language}"} for automatic type detection
              </p>
            </div>
            <div className="space-y-2">
              <Label>Variables (comma-separated)</Label>
              <Input
                placeholder="tone, subject, recipient"
                value={newTemplate.variables?.join(", ") || ""}
                onChange={(e) => setNewTemplate({ 
                  ...newTemplate, 
                  variables: e.target.value.split(",").map(v => v.trim()).filter(Boolean)
                })}
              />
            </div>
            <Button onClick={handleSaveTemplate} className="w-full">
              {editingTemplate ? "Update Template" : "Add Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}