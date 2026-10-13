'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Filter, 
  Download, 
  Upload, 
  Search, 
  SlidersHorizontal, 
  AlertCircle, 
  CheckCircle2, 
  DollarSign, 
  Users, 
  Calendar, 
  ChevronDown, 
  RefreshCw, 
  FileSpreadsheet, 
  Info,
  X
} from 'lucide-react';
import { Dataset, ColumnFilter } from '@/types';
import FileUploadModal from '@/components/FileUploadModal';
import { exportToExcel, exportToCsv } from '@/lib/fileParser';
import { auditTunjanganData, AuditConfig } from '@/lib/tunjangan';
import { formatRupiah } from '@/lib/utils';
import { sampleTunjanganData } from '@/lib/sampleData';

function FilterKolomContent() {
  const searchParams = useSearchParams();
  const initialDatasetId = searchParams.get('datasetId');

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [currentColumns, setCurrentColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  // Global search & per-column filters
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'all' | 'audit_tunjangan'>('all');

  // Audit Tunjangan Mapping & Config
  const [mapping, setMapping] = useState({
    nipColumn: '',
    namaColumn: '',
    kodeTunjanganColumn: '',
    usiaAnakColumn: '',
    suratKuliahColumn: '',
    nilaiTunjanganColumn: ''
  });

  const [auditConfig, setAuditConfig] = useState<AuditConfig>({
    maxUsiaAnak: 21,
    maxJumlahAnak: 2,
    cekSuratKuliah: true
  });

  // Fetch all datasets on mount
  useEffect(() => {
    fetch('/api/datasets')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.datasets) {
          setDatasets(data.datasets);
          if (initialDatasetId && data.datasets.some((d: any) => d.id === initialDatasetId)) {
            setSelectedDatasetId(initialDatasetId);
          } else if (data.datasets.length > 0) {
            setSelectedDatasetId(data.datasets[0].id);
          } else {
            // Load sample if no datasets yet
            loadFallbackSample();
          }
        } else {
          loadFallbackSample();
        }
      })
      .catch(() => loadFallbackSample());
  }, [initialDatasetId]);

  const loadFallbackSample = () => {
    const sampleRows = sampleTunjanganData;
    const cols = Object.keys(sampleRows[0]);
    setCurrentColumns(cols);
    setRows(sampleRows);
    autoDetectMapping(cols);
  };

  // Fetch dataset rows when selectedDatasetId changes
  useEffect(() => {
    if (!selectedDatasetId) return;
    setLoading(true);
    fetch(`/api/datasets/${selectedDatasetId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.dataset) {
          setCurrentColumns(data.dataset.columns || []);
          const mappedRows = data.rows.map((r: any) => r.data || r);
          setRows(mappedRows);
          autoDetectMapping(data.dataset.columns || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedDatasetId]);

  // Auto detect columns for Tunjangan feature
  const autoDetectMapping = (cols: string[]) => {
    const findCol = (terms: string[]) => {
      return cols.find(c => terms.some(t => c.toLowerCase().includes(t.toLowerCase()))) || '';
    };

    setMapping({
      nipColumn: findCol(['nip', 'nomor_induk', 'id_pegawai']) || cols[0] || '',
      namaColumn: findCol(['nama_pegawai', 'nama', 'pegawai']) || cols[1] || '',
      kodeTunjanganColumn: findCol(['kode_keluarga', 'kode_tunjangan', 'kode', 'hubungan', 'status']) || cols[2] || '',
      usiaAnakColumn: findCol(['usia', 'umur', 'tgl_lahir', 'tanggal_lahir']) || cols[4] || '',
      suratKuliahColumn: findCol(['surat_kuliah', 'surat_keterangan', 'kuliah', 'sekolah']) || cols[5] || '',
      nilaiTunjanganColumn: findCol(['nilai_tunjangan', 'tunjangan', 'nominal', 'besar_tunjangan', 'gaji']) || cols[6] || ''
    });
  };

  // Filtered rows for Tab 1 (Universal Filter)
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      // Global search
      if (globalSearch) {
        const matchesGlobal = Object.values(row).some(val => 
          String(val ?? '').toLowerCase().includes(globalSearch.toLowerCase())
        );
        if (!matchesGlobal) return false;
      }

      // Per-column filter
      for (const [col, filterVal] of Object.entries(columnFilters)) {
        if (!filterVal) continue;
        const cellValue = String(row[col] ?? '').toLowerCase();
        if (!cellValue.includes(filterVal.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [rows, globalSearch, columnFilters]);

  // Audit calculation for Tab 2
  const auditResult = useMemo(() => {
    if (!mapping.nipColumn || !mapping.kodeTunjanganColumn) {
      return { auditRows: [], summary: null };
    }
    return auditTunjanganData(rows, mapping, auditConfig);
  }, [rows, mapping, auditConfig]);

  // Handle column filter change
  const handleColumnFilterChange = (col: string, val: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [col]: val
    }));
  };

  const handleClearFilters = () => {
    setGlobalSearch('');
    setColumnFilters({});
  };

  // Export handlers
  const handleExportUniversal = (type: 'excel' | 'csv') => {
    const filename = `filtered_data_${Date.now()}`;
    if (type === 'excel') {
      exportToExcel(filteredRows, `${filename}.xlsx`);
    } else {
      exportToCsv(filteredRows, `${filename}.csv`);
    }
  };

  const handleExportAudit = (type: 'excel' | 'csv') => {
    if (!auditResult.auditRows.length) return;
    const exportRows = auditResult.auditRows.map(r => ({
      'NIP': r.nip,
      'Nama Pegawai': r.nama,
      'Kode Hubungan': r.kodeTunjangan,
      'Hubungan': r.hubungan,
      'Usia': r.usiaAnak ?? '-',
      'Surat Keterangan Kuliah': r.statusSurat,
      'Nilai Tunjangan (Rp)': r.nilaiTunjangan,
      'Status Pelanggaran': r.alasanKelebihan.length ? r.alasanKelebihan.join(' | ') : 'Sesuai Ketentuan',
      'Kelebihan Bayar Tunjangan Anak (Rp)': r.kelebihanTunjanganAnak,
      'Total Kelebihan Penerimaan (Rp)': r.totalKelebihan
    }));

    const filename = `hasil_audit_tunjangan_${Date.now()}`;
    if (type === 'excel') {
      exportToExcel(exportRows, `${filename}.xlsx`);
    } else {
      exportToCsv(exportRows, `${filename}.csv`);
    }
  };

  const activeFiltersCount = Object.values(columnFilters).filter(Boolean).length + (globalSearch ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Header & Dataset Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Filter className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              Menu Filter Kolom & Audit Tunjangan
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Filter dinamis per kolom dan audit otomatis tunjangan istri/anak (kode 10, 11, 12, dst.)
          </p>
        </div>

        {/* Dataset selector & upload button */}
        <div className="flex items-center gap-2">
          <select
            value={selectedDatasetId}
            onChange={(e) => setSelectedDatasetId(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 max-w-xs"
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.row_count} baris)
              </option>
            ))}
            {datasets.length === 0 && (
              <option value="">Sample Data Tunjangan</option>
            )}
          </select>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload File
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'all'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filter Semua Kolom ({filteredRows.length} Baris)
        </button>
        <button
          onClick={() => setActiveTab('audit_tunjangan')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'audit_tunjangan'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          Audit Kelebihan Tunjangan Anak & Istri
          {auditResult.summary && auditResult.summary.totalKelebihanNominal > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-100 text-red-700 font-bold">
              {auditResult.summary.jumlahKasusAnakLebih2 + auditResult.summary.jumlahKasusMelebihiUsia + auditResult.summary.jumlahKasusTanpaSurat} Temuan
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: UNIVERSAL COLUMN FILTER */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Cari kata kunci di semua kolom..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {activeFiltersCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition"
                >
                  <X className="w-3.5 h-3.5" /> Reset Filter ({activeFiltersCount})
                </button>
              )}
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium mr-1">Download Hasil Filter:</span>
              <button
                onClick={() => handleExportUniversal('excel')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5" /> Excel (.xlsx)
              </button>
              <button
                onClick={() => handleExportUniversal('csv')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 text-white hover:bg-slate-800 shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
          </div>

          {/* Table with per-column input filters */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-20 border-b border-slate-200">
                  {/* Column Titles */}
                  <tr>
                    <th className="py-2.5 px-3 font-bold text-slate-700 border-r border-slate-200 w-12 text-center">
                      No
                    </th>
                    {currentColumns.map((col) => (
                      <th key={col} className="py-2.5 px-3 font-bold text-slate-700 border-r border-slate-200 min-w-[160px]">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate">{col}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                  {/* Per-column filter inputs */}
                  <tr className="bg-slate-100/70 border-b border-slate-200">
                    <td className="p-1 text-center text-[10px] text-slate-400 font-medium">Filter:</td>
                    {currentColumns.map((col) => (
                      <td key={`filter-${col}`} className="p-1.5 border-r border-slate-200">
                        <input
                          type="text"
                          value={columnFilters[col] || ''}
                          onChange={(e) => handleColumnFilterChange(col, e.target.value)}
                          placeholder={`Filter ${col}...`}
                          className="w-full px-2 py-1 text-[11px] rounded-md border border-slate-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={currentColumns.length + 1} className="py-12 text-center text-slate-400">
                        Memuat data tabel...
                      </td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={currentColumns.length + 1} className="py-12 text-center text-slate-400">
                        Tidak ada data yang cocok dengan kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.slice(0, 150).map((row, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/30 transition">
                        <td className="py-2 px-3 text-center text-slate-400 font-medium border-r border-slate-100">
                          {idx + 1}
                        </td>
                        {currentColumns.map((col) => {
                          const val = row[col];
                          const isNumber = typeof val === 'number';
                          return (
                            <td 
                              key={col} 
                              className={`py-2 px-3 border-r border-slate-100 truncate max-w-xs ${
                                isNumber ? 'text-right font-mono' : 'text-slate-800'
                              }`}
                            >
                              {val !== null && val !== undefined ? String(val) : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredRows.length > 150 && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
                Menampilkan 150 dari {filteredRows.length} baris hasil filter. Download file Excel/CSV untuk melihat seluruh baris.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT TUNJANGAN ISTRI & ANAK */}
      {activeTab === 'audit_tunjangan' && (
        <div className="space-y-6">
          {/* Mapping & Rule Controls Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Konfigurasi Mapping Kolom & Aturan Audit Tunjangan
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Aturan: Istri = Kode 10, Anak ke-1 = 11, Anak ke-2 = 12, dst.
              </span>
            </div>

            {/* Column Mappings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  1. Kolom NIP Pegawai
                </label>
                <select
                  value={mapping.nipColumn}
                  onChange={(e) => setMapping(prev => ({ ...prev, nipColumn: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">Pilih Kolom NIP</option>
                  {currentColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  2. Kolom Nama Pegawai
                </label>
                <select
                  value={mapping.namaColumn}
                  onChange={(e) => setMapping(prev => ({ ...prev, namaColumn: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">Pilih Kolom Nama</option>
                  {currentColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  3. Kolom Kode Tunjangan (10/11/12...)
                </label>
                <select
                  value={mapping.kodeTunjanganColumn}
                  onChange={(e) => setMapping(prev => ({ ...prev, kodeTunjanganColumn: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">Pilih Kolom Kode</option>
                  {currentColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  4. Kolom Usia / Tgl Lahir Anak
                </label>
                <select
                  value={mapping.usiaAnakColumn}
                  onChange={(e) => setMapping(prev => ({ ...prev, usiaAnakColumn: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">Pilih Kolom Usia</option>
                  {currentColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  5. Kolom Surat Keterangan Kuliah
                </label>
                <select
                  value={mapping.suratKuliahColumn}
                  onChange={(e) => setMapping(prev => ({ ...prev, suratKuliahColumn: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">Pilih Kolom Surat Kuliah</option>
                  {currentColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  6. Kolom Nilai Tunjangan (Nominal)
                </label>
                <select
                  value={mapping.nilaiTunjanganColumn}
                  onChange={(e) => setMapping(prev => ({ ...prev, nilaiTunjanganColumn: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">Pilih Kolom Nilai Tunjangan</option>
                  {currentColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Threshold Parameters */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Batas Maksimal Usia Anak:</span>
                <input
                  type="number"
                  min="1"
                  max="35"
                  value={auditConfig.maxUsiaAnak}
                  onChange={(e) => setAuditConfig(prev => ({ ...prev, maxUsiaAnak: parseInt(e.target.value) || 21 }))}
                  className="w-16 px-2 py-1 text-center font-bold text-indigo-700 bg-white border border-slate-300 rounded-lg"
                />
                <span className="text-slate-500">Tahun</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Maksimal Anak Ditanggung:</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={auditConfig.maxJumlahAnak}
                  onChange={(e) => setAuditConfig(prev => ({ ...prev, maxJumlahAnak: parseInt(e.target.value) || 2 }))}
                  className="w-16 px-2 py-1 text-center font-bold text-indigo-700 bg-white border border-slate-300 rounded-lg"
                />
                <span className="text-slate-500">Anak (Anak ke-1 & ke-2)</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cekSurat"
                  checked={auditConfig.cekSuratKuliah}
                  onChange={(e) => setAuditConfig(prev => ({ ...prev, cekSuratKuliah: e.target.checked }))}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="cekSurat" className="font-semibold text-slate-700 cursor-pointer">
                  Wajibkan Surat Keterangan Kuliah untuk anak usia sekolah/kuliah
                </label>
              </div>
            </div>
          </div>

          {/* Audit KPI Cards */}
          {auditResult.summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Total Kelebihan Bayar</span>
                  <div className="p-2 rounded-xl bg-red-50 text-red-600">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-xl font-black text-red-600">
                  {formatRupiah(auditResult.summary.totalKelebihanNominal)}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  Kelebihan dari tunjangan anak & istri
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Pegawai Terkena Temuan</span>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-xl font-black text-slate-900">
                  {auditResult.summary.totalPegawaiBermasalah} <span className="text-xs font-normal text-slate-500">dari {auditResult.summary.totalPegawai} pegawai</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  Memiliki indikasi kelebihan klaim
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Anak Melebihi Kuota (&gt; {auditConfig.maxJumlahAnak})</span>
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-xl font-black text-slate-900">
                  {auditResult.summary.jumlahKasusAnakLebih2} <span className="text-xs font-normal text-slate-500">kasus</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  Klaim anak ke-3, ke-4 dst (Kode &gt; 12)
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Melebihi Usia / Tanpa Surat</span>
                  <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-xl font-black text-slate-900">
                  {auditResult.summary.jumlahKasusMelebihiUsia + auditResult.summary.jumlahKasusTanpaSurat} <span className="text-xs font-normal text-slate-500">kasus</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  Usia &gt; {auditConfig.maxUsiaAnak} thn / tidak ada surat aktif
                </div>
              </div>
            </div>
          )}

          {/* Audit Results Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Daftar Rincian Hasil Audit Tunjangan
                </h3>
                <p className="text-xs text-slate-500">
                  Baris bergaris merah menunjukkan temuan kelebihan penerimaan yang harus dikembalikan
                </p>
              </div>

              {/* Export Audit Report */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportAudit('excel')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" /> Download Laporan Audit (.xlsx)
                </button>
                <button
                  onClick={() => handleExportAudit('csv')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 text-white hover:bg-slate-800 shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-20 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-slate-200 w-12 text-center">No</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 min-w-[130px]">NIP</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 min-w-[150px]">Nama Pegawai</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Kode / Hubungan</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Usia</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Surat Kuliah</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-right">Nilai Tunjangan</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 min-w-[200px]">Status & Indikasi Pelanggaran</th>
                    <th className="py-2.5 px-3 text-right min-w-[140px]">Kelebihan Bayar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditResult.auditRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Pilih kolom mapping di atas untuk menjalankan audit tunjangan.
                      </td>
                    </tr>
                  ) : (
                    auditResult.auditRows.map((r, idx) => {
                      const hasViolation = r.totalKelebihan > 0;
                      return (
                        <tr 
                          key={idx} 
                          className={`transition ${hasViolation ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-slate-50/60'}`}
                        >
                          <td className="py-2 px-3 text-center text-slate-400 border-r border-slate-100">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono font-medium text-slate-900 border-r border-slate-100">{r.nip}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800 border-r border-slate-100">{r.nama}</td>
                          <td className="py-2 px-3 text-center border-r border-slate-100">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.hubungan.includes('Istri') 
                                ? 'bg-pink-50 text-pink-700' 
                                : r.isAnakLebihDari2
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}>
                              {r.hubungan} ({r.kodeTunjangan})
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center border-r border-slate-100">
                            {r.usiaAnak !== null && r.usiaAnak !== undefined ? (
                              <span className={r.isMelebihiUsia ? 'font-bold text-red-600' : 'text-slate-700'}>
                                {r.usiaAnak} thn
                              </span>
                            ) : '-'}
                          </td>
                          <td className="py-2 px-3 text-center border-r border-slate-100">
                            {r.statusSurat === 'Ada' ? (
                              <span className="text-emerald-700 font-medium">Ada</span>
                            ) : (
                              <span className={r.isTanpaSuratKuliah ? 'font-bold text-red-600' : 'text-slate-400'}>
                                {r.statusSurat}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-700 border-r border-slate-100">
                            {formatRupiah(r.nilaiTunjangan)}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-100">
                            {hasViolation ? (
                              <div className="space-y-1">
                                {r.alasanKelebihan.map((alasan, aIdx) => (
                                  <span key={aIdx} className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-semibold bg-red-100 text-red-800 mr-1 mb-1">
                                    ⚠️ {alasan}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-emerald-600 font-medium inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Memenuhi Syarat
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold">
                            {hasViolation ? (
                              <span className="text-red-600">{formatRupiah(r.totalKelebihan)}</span>
                            ) : (
                              <span className="text-slate-400">Rp 0</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        defaultCategory="tunjangan"
        onSuccess={(dataset, uploadedRows) => {
          setDatasets(prev => [dataset, ...prev]);
          setSelectedDatasetId(dataset.id);
          setCurrentColumns(dataset.columns);
          setRows(uploadedRows);
          autoDetectMapping(dataset.columns);
        }}
      />
    </div>
  );
}

export default function FilterKolomPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Memuat Menu Filter Kolom...</div>}>
      <FilterKolomContent />
    </Suspense>
  );
}
