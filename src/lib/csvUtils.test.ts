import { describe, it, expect } from 'vitest';

export function parseCsvContacts(csvText: string) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const emailIndex = headers.findIndex(h => h.includes('email'));
  const nameIndex = headers.findIndex(h => h.includes('name'));
  const tagsIndex = headers.findIndex(h => h.includes('tag'));

  if (emailIndex === -1) return [];

  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const contact: any = {
      email: values[emailIndex] || '',
    };

    if (nameIndex >= 0 && values[nameIndex]) {
      contact.name = values[nameIndex];
    }

    if (tagsIndex >= 0 && values[tagsIndex]) {
      contact.tags = values[tagsIndex].split(';').map((t: string) => t.trim()).filter(Boolean);
    }

    return contact;
  }).filter(contact => contact.email && contact.email.includes('@'));
}

describe('CSV Utils', () => {
  it('should parse basic CSV with email and name', () => {
    const csv = `email,name
john@example.com,John Doe
jane@example.com,Jane Smith`;
    
    const result = parseCsvContacts(csv);
    
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ email: 'john@example.com', name: 'John Doe' });
    expect(result[1]).toEqual({ email: 'jane@example.com', name: 'Jane Smith' });
  });

  it('should parse CSV with tags', () => {
    const csv = `email,name,tags
john@example.com,John Doe,newsletter;customer
jane@example.com,Jane Smith,newsletter`;
    
    const result = parseCsvContacts(csv);
    
    expect(result[0].tags).toEqual(['newsletter', 'customer']);
    expect(result[1].tags).toEqual(['newsletter']);
  });

  it('should filter out invalid emails', () => {
    const csv = `email,name
john@example.com,John Doe
invalid-email,Jane Smith
,Empty Email`;
    
    const result = parseCsvContacts(csv);
    
    expect(result).toHaveLength(1);
    expect(result[0].email).toBe('john@example.com');
  });

  it('should handle empty CSV', () => {
    expect(parseCsvContacts('')).toEqual([]);
    expect(parseCsvContacts('email')).toEqual([]);
  });
});
