export interface Dataset {
  id: string;
  name: string;
  file_type: 'csv' | 'xlsx' | 'xls';
  category?: 'general' | 'tunjangan' | 'perjalanan_dinas';
  columns: string[];
  row_count: number;
  created_at: string;
}

export interface DatasetRow {
  id?: string;
  dataset_id?: string;
  row_index: number;
  data: Record<string, any>;
}

export type FilterOperator = 
  | 'contains' 
  | 'equals' 
  | 'starts_with' 
  | 'gt' 
  | 'gte' 
  | 'lt' 
  | 'lte' 
  | 'between' 
  | 'in';

export interface ColumnFilter {
  column: string;
  operator: FilterOperator;
  value: any;
  valueTo?: any; // For 'between'
}

// Tunjangan Feature Types
export interface TunjanganColumnMapping {
  nipColumn: string;
  namaColumn: string;
  kodeTunjanganColumn: string;
  usiaAnakColumn: string;
  suratKuliahColumn: string;
  nilaiTunjanganColumn: string;
}

export interface TunjanganAuditRow {
  rowIndex: number;
  nip: string;
  nama: string;
  kodeTunjangan: string | number;
  hubungan: string; // "Istri/Suami", "Anak ke-1", "Anak ke-2", "Anak ke-3+", "Lainnya"
  usiaAnak?: number | null;
  statusSurat?: string;
  nilaiTunjangan: number;
  
  // Violations
  isAnakLebihDari2: boolean;
  isMelebihiUsia: boolean;
  isTanpaSuratKuliah: boolean;
  
  // Calculation
  kelebihanTunjanganAnak: number;
  kelebihanTunjanganIstri: number;
  totalKelebihan: number;
  alasanKelebihan: string[];
  originalRow: Record<string, any>;
}

export interface TunjanganSummary {
  totalPegawai: number;
  totalPegawaiBermasalah: number;
  totalKelebihanNominal: number;
  totalKelebihanAnak: number;
  totalKelebihanIstri: number;
  jumlahKasusAnakLebih2: number;
  jumlahKasusMelebihiUsia: number;
  jumlahKasusTanpaSurat: number;
}

// Kolom Irisan (Overlap) Types
export interface OverlapColumnMapping {
  nipColumn: string;
  namaColumn: string;
  suratTugasColumn: string;
  tanggalBerangkatColumn: string;
  tanggalKembaliColumn: string;
  dinasColumn?: string;
}

export interface SuratTugasItem {
  nomorST: string;
  tanggalBerangkat: string; // YYYY-MM-DD
  tanggalKembali: string;   // YYYY-MM-DD
  durasiHari: number;
  dinas?: string;
  rawRow: Record<string, any>;
}

export interface OverlapCase {
  nip: string;
  nama: string;
  dinas?: string;
  suratTugasList: SuratTugasItem[];
  // Overlapping pairs / groups
  overlappingDates: string[]; // List of YYYY-MM-DD
  jumlahHariIrisan: number;
  nomorSTTerlibat: string[];
}

export interface OverlapSummary {
  totalPegawaiTerlibat: number;
  totalKasusIrisan: number;
  totalHariIrisan: number;
  daftarDinas: string[];
}
