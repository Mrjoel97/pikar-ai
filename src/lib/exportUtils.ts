import { toast } from "sonner";

/**
 * Universal Export Utility
 * Supports PDF, Excel (XLSX), and CSV formats
 */

export type ExportFormat = "csv" | "xlsx" | "pdf";

export interface ExportColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

export interface ExportOptions {
  filename: string;
  format: ExportFormat;
  columns: ExportColumn[];
  data: any[];
  title?: string;
  subtitle?: string;
  includeTimestamp?: boolean;
}

/**
 * Export data to CSV format
 */
export function exportToCSV(options: ExportOptions): void {
  const { filename, columns, data, includeTimestamp = true } = options;
  
  const lines: string[] = [];
  
  // Add header
  lines.push(columns.map(col => `"${col.label}"`).join(","));
  
  // Add data rows
  for (const row of data) {
    const values = columns.map(col => {
      const value = row[col.key];
      const formatted = col.format ? col.format(value) : String(value ?? "");
      return `"${formatted.replace(/"/g, '""')}"`;
    });
    lines.push(values.join(","));
  }
  
  // Add timestamp footer if requested
  if (includeTimestamp) {
    lines.push("");
    lines.push(`"Generated at","${new Date().toISOString()}"`);
  }
  
  const csv = lines.join("\n");
  downloadFile(csv, `${filename}.csv`, "text/csv");
}

/**
 * Export data to Excel format (simplified XLSX)
 */
export function exportToExcel(options: ExportOptions): void {
  const { filename, columns, data, title, includeTimestamp = true } = options;
  
  // Create HTML table that Excel can import
  let html = '<html><head><meta charset="utf-8"></head><body>';
  
  if (title) {
    html += `<h1>${title}</h1>`;
  }
  
  html += '<table border="1">';
  
  // Header row
  html += '<thead><tr>';
  columns.forEach(col => {
    html += `<th>${col.label}</th>`;
  });
  html += '</tr></thead>';
  
  // Data rows
  html += '<tbody>';
  data.forEach(row => {
    html += '<tr>';
    columns.forEach(col => {
      const value = row[col.key];
      const formatted = col.format ? col.format(value) : String(value ?? "");
      html += `<td>${formatted}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody>';
  
  // Timestamp footer
  if (includeTimestamp) {
    html += '<tfoot><tr>';
    html += `<td colspan="${columns.length}">Generated at: ${new Date().toLocaleString()}</td>`;
    html += '</tr></tfoot>';
  }
  
  html += '</table></body></html>';
  
  downloadFile(html, `${filename}.xls`, "application/vnd.ms-excel");
}

/**
 * Export data to PDF format (HTML-based)
 */
export function exportToPDF(options: ExportOptions): void {
  const { filename, columns, data, title, subtitle, includeTimestamp = true } = options;
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        h1 { color: #059669; margin-bottom: 10px; }
        h2 { color: #6b7280; font-size: 14px; margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background-color: #f3f4f6; font-weight: 600; }
        tr:hover { background-color: #f9fafb; }
        .footer { margin-top: 30px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
  `;
  
  if (title) {
    html += `<h1>${title}</h1>`;
  }
  if (subtitle) {
    html += `<h2>${subtitle}</h2>`;
  }
  
  html += '<table>';
  
  // Header
  html += '<thead><tr>';
  columns.forEach(col => {
    html += `<th>${col.label}</th>`;
  });
  html += '</tr></thead>';
  
  // Data
  html += '<tbody>';
  data.forEach(row => {
    html += '<tr>';
    columns.forEach(col => {
      const value = row[col.key];
      const formatted = col.format ? col.format(value) : String(value ?? "");
      html += `<td>${formatted}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody>';
  
  html += '</table>';
  
  if (includeTimestamp) {
    html += `<div class="footer">Generated on ${new Date().toLocaleString()}</div>`;
  }
  
  html += '</body></html>';
  
  downloadFile(html, `${filename}.html`, "text/html");
  toast.info("PDF preview opened. Use browser's Print > Save as PDF");
  
  // Open in new window for printing
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

/**
 * Universal export function
 */
export function exportData(options: ExportOptions): void {
  try {
    switch (options.format) {
      case "csv":
        exportToCSV(options);
        break;
      case "xlsx":
        exportToExcel(options);
        break;
      case "pdf":
        exportToPDF(options);
        break;
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
    
    if (options.format !== "pdf") {
      toast.success(`Exported to ${options.format.toUpperCase()}`);
    }
  } catch (error: any) {
    toast.error(error?.message || "Export failed");
    console.error("Export error:", error);
  }
}

/**
 * Helper to download file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format helpers for common data types
 */
export const formatters = {
  date: (value: any) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString();
  },
  datetime: (value: any) => {
    if (!value) return "";
    return new Date(value).toLocaleString();
  },
  currency: (value: any) => {
    if (value == null) return "$0.00";
    return `$${Number(value).toFixed(2)}`;
  },
  percentage: (value: any) => {
    if (value == null) return "0%";
    return `${Number(value).toFixed(1)}%`;
  },
  boolean: (value: any) => {
    return value ? "Yes" : "No";
  },
};
