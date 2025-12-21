import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, CheckCircle, AlertCircle, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  multiple?: boolean;
  onMultipleFilesChange?: (files: File[]) => void;
}

export function FileUploadSection({
  processingStage,
  uploadProgress,
  uploadedFileName,
  fileStats,
  noteText,
  onFileChange,
  onNoteTextChange,
  multiple = false,
  onMultipleFilesChange,
}: FileUploadSectionProps) {
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);

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

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (multiple && files.length > 0) {
      setSelectedFiles(files);
      onMultipleFilesChange?.(files);
    } else if (files.length > 0) {
      onFileChange(files[0]);
    }
  };

  const removeFile = (index: number) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
    onMultipleFilesChange?.(updated);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="fileUpload">
        Upload File{multiple ? 's' : ''} *
      </Label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            id="fileUpload"
            type="file"
            accept={ALLOWED_EXTENSIONS.join(',')}
            onChange={handleFileSelection}
            disabled={processingStage === 'uploading' || processingStage === 'processing'}
            multiple={multiple}
            className="cursor-pointer"
          />
          {multiple && selectedFiles.length > 0 && (
            <Badge variant="secondary" className="absolute right-2 top-1/2 -translate-y-1/2">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        {getProcessingIcon()}
      </div>
      <p className="text-xs text-muted-foreground">
        Supported formats: TXT, MD, DOC, DOCX, PDF (Max size: 10MB{multiple ? ' per file' : ''})
      </p>
      
      {multiple && selectedFiles.length > 0 && (
        <div className="space-y-2 mt-3">
          <Label className="text-sm font-medium">Selected Files:</Label>
          <div className="space-y-1">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="text-sm truncate">{file.name}</span>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {(file.size / 1024).toFixed(1)} KB
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile(index)}
                  className="h-6 w-6 p-0 flex-shrink-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {(processingStage === 'uploading' || processingStage === 'processing') && (
        <div className="space-y-2 mt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{getProcessingMessage()}</span>
            <span className="font-medium">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}
      
      {uploadedFileName && !multiple && (
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary">
            <FileText className="h-3 w-3 mr-1" />
            {uploadedFileName}
          </Badge>
          {fileStats && (
            <Badge variant="outline">
              {fileStats.wordCount} words, {fileStats.charCount} chars
            </Badge>
          )}
        </div>
      )}
      
      {noteText && !multiple && (
        <div className="mt-3 space-y-2">
          <Label>Extracted Content Preview</Label>
          <Textarea
            value={noteText}
            onChange={(e) => onNoteTextChange(e.target.value)}
            rows={8}
            className="mt-1 font-mono text-xs"
            placeholder="File content will appear here..."
          />
          <p className="text-xs text-muted-foreground">
            You can edit the extracted content before saving
          </p>
        </div>
      )}
    </div>
  );
}