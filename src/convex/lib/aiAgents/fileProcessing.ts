"use node";

import { action } from "../../_generated/server";
import { v } from "convex/values";
import { api } from "../../_generated/api";

/**
 * Process uploaded file and extract text content
 * Supports: TXT, MD, PDF, DOC, DOCX
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
      } else if (fileExtension === 'pdf') {
        // PDF processing - using a simple text extraction approach
        // For production, consider using pdf-parse or similar library
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Basic PDF text extraction (this is a simplified approach)
        // In production, you'd want to use a proper PDF parsing library
        const text = buffer.toString('utf-8');
        
        // Try to extract readable text (very basic approach)
        const textMatch = text.match(/\/Contents\s*\((.*?)\)/gs);
        if (textMatch) {
          extractedText = textMatch.map(m => m.replace(/\/Contents\s*\(|\)/g, '')).join('\n');
        } else {
          // Fallback: try to get any readable text
          extractedText = text.replace(/[^\x20-\x7E\n]/g, '').trim();
        }
        
        if (!extractedText || extractedText.length < 50) {
          throw new Error("Could not extract text from PDF. The file may be image-based or encrypted.");
        }
      } else if (fileExtension === 'doc' || fileExtension === 'docx') {
        // DOC/DOCX processing
        // For DOCX (which is a ZIP file), we'd need to extract and parse XML
        // This is a placeholder - in production, use mammoth or similar library
        throw new Error("DOC/DOCX processing requires additional libraries. Please convert to PDF or TXT for now.");
      } else {
        throw new Error(`Unsupported file type: ${fileExtension}`);
      }

      // Clean up extracted text
      extractedText = extractedText
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      if (!extractedText) {
        throw new Error("No text content could be extracted from the file");
      }

      return {
        success: true,
        text: extractedText,
        fileId: args.fileId,
        fileName: args.fileName,
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
