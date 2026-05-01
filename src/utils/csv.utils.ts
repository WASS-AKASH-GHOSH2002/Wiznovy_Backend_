import { Response } from 'express';

export interface CsvColumn {
  header: string;
  value: (row: any) => any;
}

function escapeCell(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  return str.includes(',') || str.includes('"') || str.includes('\n')
    ? `"${str.replace(/"/g, '""')}"`
    : str;
}

export function buildCsv(columns: CsvColumn[], data: any[]): string {
  const header = columns.map(c => escapeCell(c.header)).join(',');
  const rows = data.map(row =>
    columns.map(c => escapeCell(c.value(row))).join(',')
  );
  return [header, ...rows].join('\n');
}

export function formatCsvDate(date: Date): string {
  if (!date) return '';
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function sendCsvResponse(res: Response, csv: string, fileName: string): void {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(csv);
}

export function generateCsvFileName(prefix: string): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  return `${prefix}-${date}.csv`;
}
