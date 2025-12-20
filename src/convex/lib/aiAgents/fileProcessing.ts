"use node";

import { action } from "../../_generated/server";
import { v } from "convex/values";
import * as mammoth from "mammoth";

/**
 * Process uploaded file and extract text content
 * Supports: TXT, MD, DOCX
 * Note: PDF support removed due to canvas dependency issues in Node.js runtime
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
      } else if (fileExtension === 'docx') {
        // DOCX processing using mammoth
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        try {
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value;
          
          if (!extractedText || extractedText.trim().length < 10) {
            throw new Error("DOCX appears to be empty");
          }
          
          // Log any warnings from mammoth
          if (result.messages.length > 0) {
            console.warn("DOCX parsing warnings:", result.messages);
          }
        } catch (docxError: any) {
          throw new Error(`DOCX parsing failed: ${docxError.message}`);
        }
      } else if (fileExtension === 'pdf') {
        throw new Error("PDF support is temporarily unavailable. Please convert to TXT, MD, or DOCX format.");
      } else if (fileExtension === 'doc') {
        throw new Error("Legacy DOC format is not supported. Please convert to DOCX, TXT, or MD format.");
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
        wordCount: extractedText.split(/\s+/).length,
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