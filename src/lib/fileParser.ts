import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface ParseResult {
  columns: string[];
  rows: Record<string, any>[];
  fileName: string;
  fileType: 'csv' | 'xlsx' | 'xls';
}

export function parseFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rawRows = results.data as Record<string, any>[];
          const columns = results.meta.fields || (rawRows.length > 0 ? Object.keys(rawRows[0]) : []);
          resolve({
            columns,
            rows: rawRows,
            fileName: file.name,
            fileType: 'csv'
          });
        },
        error: (err) => reject(new Error(err.message))
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

          const columns = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

          resolve({
            columns,
            rows: jsonData,
            fileName: file.name,
            fileType: extension as 'xlsx' | 'xls'
          });
        } catch (err: any) {
          reject(new Error(err.message || 'Gagal membaca file Excel'));
        }
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error('Format file tidak didukung. Harap upload .csv atau .xlsx'));
    }
  });
}

export function exportToExcel(data: Record<string, any>[], fileName: string = 'export.xlsx') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, fileName);
}

export function exportToCsv(data: Record<string, any>[], fileName: string = 'export.csv') {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
