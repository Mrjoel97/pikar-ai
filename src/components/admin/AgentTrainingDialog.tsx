import React, { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, FileText, Link as LinkIcon, Type, Trash2, BookOpen } from "lucide-react";

interface AgentTrainingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentKey: string;
  agentName: string;
}

export function AgentTrainingDialog({
  open,
  onOpenChange,
  agentKey,
  agentName,
}: AgentTrainingDialogProps) {
  const [sourceType, setSourceType] = useState<"url" | "text" | "file">("text");
  const [sourceUrl, setSourceUrl] = useState("");
  const [noteText, setNoteText] = useState("");
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const datasets = useQuery(api.lib.aiAgents.datasets.listDatasets as any) as Array<{
    _id: string;
    title: string;
    sourceType: string;
    sourceUrl?: string;
    noteText?: string;
    linkedAgentKeys: string[];
    status: string;
    createdAt: number;
  }> | undefined;

  const createDataset = useMutation(api.lib.aiAgents.datasets.adminCreateDataset as any);
  const linkDataset = useMutation(api.lib.aiAgents.datasets.adminLinkDatasetToAgent as any);
  const unlinkDataset = useMutation(api.lib.aiAgents.datasets.adminUnlinkDatasetFromAgent as any);

  const agentDatasets = datasets?.filter(d => d.linkedAgentKeys.includes(agentKey)) || [];
  const availableDatasets = datasets?.filter(d => !d.linkedAgentKeys.includes(agentKey)) || [];

  const handleCreateDataset = async () => {
    if (!title) {
      toast.error("Please provide a title");
      return;
    }

    if (sourceType === "url" && !sourceUrl) {
      toast.error("Please provide a URL");
      return;
    }

    if (sourceType === "text" && !noteText) {
      toast.error("Please provide text content");
      return;
    }

    setIsSubmitting(true);
    try {
      const datasetId = await createDataset({
        title,
        sourceType,
        sourceUrl: sourceType === "url" ? sourceUrl : undefined,
        noteText: sourceType === "text" ? noteText : undefined,
      });

      await linkDataset({
        datasetId,
        agent_key: agentKey,
      });

      toast.success("Training data added successfully");
      
      // Reset form
      setTitle("");
      setSourceUrl("");
      setNoteText("");
    } catch (error: any) {
      toast.error(error?.message || "Failed to add training data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkExisting = async (datasetId: string) => {
    try {
      await linkDataset({
        datasetId,
        agent_key: agentKey,
      });
      toast.success("Dataset linked successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to link dataset");
    }
  };

  const handleUnlink = async (datasetId: string) => {
    try {
      await unlinkDataset({
        datasetId,
        agent_key: agentKey,
      });
      toast.success("Dataset unlinked successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to unlink dataset");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Train Agent: {agentName}</DialogTitle>
          <DialogDescription>
            Add training data to improve agent knowledge and responses
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="add" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="add">Add New Data</TabsTrigger>
            <TabsTrigger value="current">Current Training ({agentDatasets.length})</TabsTrigger>
            <TabsTrigger value="library">Dataset Library</TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Dataset Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Product Documentation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Source Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={sourceType === "text" ? "default" : "outline"}
                    onClick={() => setSourceType("text")}
                    className="flex-1"
                  >
                    <Type className="h-4 w-4 mr-2" />
                    Text
                  </Button>
                  <Button
                    type="button"
                    variant={sourceType === "url" ? "default" : "outline"}
                    onClick={() => setSourceType("url")}
                    className="flex-1"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    URL
                  </Button>
                  <Button
                    type="button"
                    variant={sourceType === "file" ? "default" : "outline"}
                    onClick={() => setSourceType("file")}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    File
                  </Button>
                </div>
              </div>

              {sourceType === "url" && (
                <div className="space-y-2">
                  <Label htmlFor="sourceUrl">URL *</Label>
                  <Input
                    id="sourceUrl"
                    placeholder="https://example.com/documentation"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                  />
                </div>
              )}

              {sourceType === "text" && (
                <div className="space-y-2">
                  <Label htmlFor="noteText">Training Text *</Label>
                  <Textarea
                    id="noteText"
                    placeholder="Paste documentation, guidelines, or knowledge here..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows={10}
                  />
                </div>
              )}

              {sourceType === "file" && (
                <div className="space-y-2">
                  <Label htmlFor="fileUpload">Upload File *</Label>
                  <Input
                    id="fileUpload"
                    type="file"
                    accept=".txt,.pdf,.doc,.docx,.md"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        toast.info(`File selected: ${file.name}. Processing...`);
                        // TODO: Implement file upload to Convex storage
                        // For now, read as text if it's a text file
                        if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const text = event.target?.result as string;
                            setNoteText(text);
                            toast.success('File content loaded');
                          };
                          reader.onerror = () => {
                            toast.error('Failed to read file');
                          };
                          reader.readAsText(file);
                        } else {
                          toast.warning('PDF and DOC files will be supported soon. Please use text files for now.');
                        }
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported formats: TXT, MD (PDF and DOC processing coming soon)
                  </p>
                  {noteText && (
                    <div className="mt-2">
                      <Label>File Content Preview</Label>
                      <Textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        rows={8}
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              )}

              <Button onClick={handleCreateDataset} disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Adding..." : "Add Training Data"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="current" className="space-y-4">
            {agentDatasets.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No training data yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Add training data to improve this agent's knowledge
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {agentDatasets.map((dataset) => (
                  <Card key={dataset._id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{dataset.title}</CardTitle>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{dataset.sourceType}</Badge>
                            <Badge variant={dataset.status === "new" ? "secondary" : "default"}>
                              {dataset.status}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUnlink(dataset._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="library" className="space-y-4">
            {availableDatasets.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No available datasets</h3>
                  <p className="text-sm text-muted-foreground">
                    All datasets are already linked to this agent
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {availableDatasets.map((dataset) => (
                  <Card key={dataset._id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{dataset.title}</CardTitle>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{dataset.sourceType}</Badge>
                            <Badge variant="secondary">
                              Used by {dataset.linkedAgentKeys.length} agent(s)
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleLinkExisting(dataset._id)}
                        >
                          Link
                        </Button>
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
