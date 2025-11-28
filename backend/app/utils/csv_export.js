/**
 * CSV Export Utility
 * Converts data arrays to CSV format
 */

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects
 * @param {Array} headers - Array of header names (optional, will use object keys if not provided)
 * @returns {String} CSV string
 */
export function arrayToCSV(data, headers = null) {
  if (!data || data.length === 0) {
    return "";
  }

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);

  // Escape CSV values
  const escapeCSV = (value) => {
    if (value === null || value === undefined) {
      return "";
    }
    const stringValue = String(value);
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Build CSV rows
  const rows = [];

  // Header row
  rows.push(csvHeaders.map(escapeCSV).join(","));

  // Data rows
  for (const row of data) {
    const values = csvHeaders.map((header) => {
      // Support nested properties (e.g., "property.address_line1")
      const keys = header.split(".");
      let value = row;
      for (const key of keys) {
        value = value?.[key];
      }
      return escapeCSV(value);
    });
    rows.push(values.join(","));
  }

  return rows.join("\n");
}

/**
 * Generate CSV filename with timestamp
 * @param {String} prefix - Filename prefix
 * @returns {String} Filename
 */
export function generateCSVFilename(prefix = "export") {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  return `${prefix}_${timestamp}.csv`;
}
