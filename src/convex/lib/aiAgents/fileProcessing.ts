"use node";

import { action } from "../../_generated/server";
import { v } from "convex/values";
import * as mammoth from "mammoth";

/**
 * Process uploaded file and extract text content
 * Supports: TXT, MD, DOCX, DOC, PDF (basic text extraction)
 * Note: PDF support is basic and works best with text-based PDFs
 */
export const processUploadedFile = action({
  args: {
    fileId: v.id("_storage"),
    fileName: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Get file URL from storage
      const fileUrl = await ctx.storage.getUrl(args.fileId);
      if (!fileUrl) {
        throw new Error("File not found in storage");
      }

      // Fetch file content
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      const fileExtension = args.fileName.split('.').pop()?.toLowerCase();
      let extractedText = "";

      // Process based on file type
      if (fileExtension === 'txt' || fileExtension === 'md') {
        // Plain text files
        extractedText = await response.text();
      } else if (fileExtension === 'docx' || fileExtension === 'doc') {
        // DOCX/DOC processing using mammoth
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        try {
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value;
          
          if (!extractedText || extractedText.trim().length < 10) {
            throw new Error(`${fileExtension.toUpperCase()} appears to be empty or could not be parsed`);
          }
          
          // Log any warnings from mammoth
          if (result.messages.length > 0) {
            console.warn(`${fileExtension.toUpperCase()} parsing warnings:`, result.messages);
          }
        } catch (docError: any) {
          throw new Error(`${fileExtension.toUpperCase()} parsing failed: ${docError.message}`);
        }
      } else if (fileExtension === 'pdf') {
        // Basic PDF text extraction without canvas dependencies
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        try {
          // Convert buffer to string and extract text between stream markers
          const pdfText = buffer.toString('binary');
          const textChunks: string[] = [];
          
          // Extract text from PDF streams
          const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
          let match;
          
          while ((match = streamRegex.exec(pdfText)) !== null) {
            const streamContent = match[1];
            // Try to extract readable text
            const readable = streamContent
              .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ') // Remove control characters
              .replace(/\s+/g, ' ')
              .trim();
            
            if (readable.length > 20) {
              textChunks.push(readable);
            }
          }
          
          // Also try to extract text objects
          const textObjectRegex = /\(([^)]+)\)/g;
          const textMatches = pdfText.match(textObjectRegex);
          
          if (textMatches) {
            textMatches.forEach(match => {
              const text = match.slice(1, -1)
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '\r')
                .replace(/\\t/g, '\t')
                .replace(/\\\\/g, '\\')
                .replace(/\\\(/g, '(')
                .replace(/\\\)/g, ')');
              
              if (text.length > 3 && /[a-zA-Z]/.test(text)) {
                textChunks.push(text);
              }
            });
          }
          
          extractedText = textChunks.join('\n').trim();
          
          if (!extractedText || extractedText.length < 50) {
            throw new Error(
              "PDF text extraction yielded minimal content. This PDF may be image-based, encrypted, or use complex formatting. " +
              "For best results, please convert to TXT or DOCX format."
            );
          }
          
          console.log(`PDF processed: extracted ${extractedText.length} characters`);
        } catch (pdfError: any) {
          throw new Error(`PDF processing failed: ${pdfError.message}`);
        }
      } else {
        throw new Error(`Unsupported file type: ${fileExtension}`);
      }

      // Clean up extracted text
      extractedText = extractedText
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\s+/g, ' ')
        .trim();

      if (!extractedText || extractedText.length < 10) {
        throw new Error("No meaningful text content could be extracted from the file");
      }

      return {
        success: true,
        text: extractedText,
        fileId: args.fileId,
        fileName: args.fileName,
        wordCount: extractedText.split(/\s+/).filter(w => w.length > 0).length,
        charCount: extractedText.length,
      };
    } catch (error: any) {
      console.error("File processing error:", error);
      return {
        success: false,
        error: error.message || "Failed to process file",
      };
    }
  },
});