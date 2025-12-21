import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Code, 
  Eye, 
  Edit3,
  Sparkles,
  Type
} from "lucide-react";

interface RichTemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  variables?: string[];
}

export function RichTemplateEditor({
  value,
  onChange,
  placeholder = "Enter your template...",
  rows = 8,
  variables = [],
}: RichTemplateEditorProps) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const insertText = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const insertVariable = (variable: string) => {
    insertText(`{${variable}}`);
  };

  const formatBold = () => insertText("**", "**");
  const formatItalic = () => insertText("*", "*");
  const formatCode = () => insertText("`", "`");
  const formatList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const newText = value.substring(0, lineStart) + "- " + value.substring(lineStart);
    onChange(newText);
  };
  const formatOrderedList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const newText = value.substring(0, lineStart) + "1. " + value.substring(lineStart);
    onChange(newText);
  };

  const renderPreview = () => {
    // Simple markdown-like preview
    let preview = value;
    
    // Replace variables with highlighted spans
    variables.forEach(variable => {
      const regex = new RegExp(`\\{${variable}\\}`, 'g');
      preview = preview.replace(regex, `<span class="bg-blue-100 dark:bg-blue-900 px-1 rounded">{${variable}}</span>`);
    });
    
    // Bold
    preview = preview.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    preview = preview.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Code
    preview = preview.replace(/`(.*?)`/g, '<code class="bg-muted px-1 rounded">$1</code>');
    
    // Lists
    preview = preview.replace(/^- (.+)$/gm, '<li>$1</li>');
    preview = preview.replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>');
    
    // Wrap lists
    preview = preview.replace(/(<li>.*<\/li>)/s, '<ul class="list-disc pl-6">$1</ul>');
    
    // Line breaks
    preview = preview.replace(/\n/g, '<br />');
    
    return preview;
  };

  return (
    <div className="space-y-2">
      <Tabs value={mode} onValueChange={(v) => setMode(v as "edit" | "preview")}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="edit" className="gap-2">
              <Edit3 className="h-4 w-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>
          
          {mode === "edit" && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={formatBold}
                title="Bold"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={formatItalic}
                title="Italic"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={formatCode}
                title="Code"
              >
                <Code className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={formatList}
                title="Bullet List"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={formatOrderedList}
                title="Numbered List"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="edit" className="space-y-2">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="font-mono text-sm"
          />
          
          {variables.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>Insert Variables:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {variables.map((variable) => (
                  <Badge
                    key={variable}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => insertVariable(variable)}
                  >
                    <Type className="h-3 w-3 mr-1" />
                    {variable}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="preview">
          <div
            className="min-h-[200px] rounded-md border bg-muted/50 p-4 text-sm"
            dangerouslySetInnerHTML={{ __html: renderPreview() }}
          />
        </TabsContent>
      </Tabs>
      
      <p className="text-xs text-muted-foreground">
        Supports: **bold**, *italic*, `code`, - lists, 1. numbered lists, and {"{variables}"}
      </p>
    </div>
  );
}
