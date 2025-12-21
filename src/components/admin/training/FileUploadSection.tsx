import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";

type ProcessingStage = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

const ALLOWED_EXTENSIONS = ['.txt', '.md', '.docx', '.doc', '.pdf'];

interface FileUploadSectionProps {
  processingStage: ProcessingStage;
  uploadProgress: number;
  uploadedFileName: string;
  fileStats: { wordCount?: number; charCount?: number } | null;
  noteText: string;
  onFileChange: (file: File) => void;
  onNoteTextChange: (text: string) => void;
}

export function FileUploadSection({
  processingStage,
  uploadProgress,
  uploadedFileName,
  fileStats,
  noteText,
  onFileChange,
  onNoteTextChange,
}: FileUploadSectionProps) {
  const getProcessingIcon = () => {
    switch (processingStage) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getProcessingMessage = () => {
    switch (processingStage) {
      case 'uploading':
        return 'Uploading file...';
      case 'processing':
        return 'Extracting text content...';
      case 'complete':
        return 'File processed successfully';
      case 'error':
        return 'Processing failed';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="fileUpload">Upload File *</Label>
      <div className="flex items-center gap-2">
        <Input
          id="fileUpload"
          type="file"
          accept={ALLOWED_EXTENSIONS.join(',')}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onFileChange(file);
            }
          }}
          disabled={processingStage === 'uploading' || processingStage === 'processing'}
        />
        {getProcessingIcon()}
      </div>
      <p className="text-xs text-muted-foreground">
        Supported formats: TXT, MD, DOC, DOCX, PDF (Max size: 10MB)
      </p>
      
      {(processingStage === 'uploading' || processingStage === 'processing') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{getProcessingMessage()}</span>
            <span className="font-medium">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}
      
      {uploadedFileName && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="mt-2">
            <FileText className="h-3 w-3 mr-1" />
            {uploadedFileName}
          </Badge>
          {fileStats && (
            <Badge variant="outline" className="mt-2">
              {fileStats.wordCount} words, {fileStats.charCount} chars
            </Badge>
          )}
        </div>
      )}
      
      {noteText && (
        <div className="mt-2">
          <Label>Extracted Content Preview</Label>
          <Textarea
            value={noteText}
            onChange={(e) => onNoteTextChange(e.target.value)}
            rows={8}
            className="mt-1"
            placeholder="File content will appear here..."
          />
          <p className="text-xs text-muted-foreground mt-1">
            You can edit the extracted content before saving
          </p>
        </div>
      )}
    </div>
  );
}
