'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  GitFork, 
  Download, 
  Upload, 
  Calendar, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  SlidersHorizontal, 
  Building2, 
  FileText,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { Dataset, OverlapCase, OverlapColumnMapping } from '@/types';
import FileUploadModal from '@/components/FileUploadModal';
import { detectOverlaps, parseDateToIso } from '@/lib/overlap';
import { exportToExcel, exportToCsv } from '@/lib/fileParser';
import { formatDateIndo } from '@/lib/utils';
import { samplePerjalananDinasData } from '@/lib/sampleData';

function KolomIrisanContent() {
  const searchParams = useSearchParams();
  const initialDatasetId = searchParams.get('datasetId');

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [currentColumns, setCurrentColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  // Column Mapping
  const [mapping, setMapping] = useState<OverlapColumnMapping>({
    namaColumn: '',
    nipColumn: '',
    suratTugasColumn: '',
    tanggalBerangkatColumn: '',
    tanggalKembaliColumn: '',
    dinasColumn: ''
  });

  // Filter Dinas
  const [selectedDinas, setSelectedDinas] = useState<string>('ALL');

  // Load datasets on mount
  useEffect(() => {
    fetch('/api/datasets')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.datasets) {
          setDatasets(data.datasets);
          if (initialDatasetId && data.datasets.some((d: any) => d.id === initialDatasetId)) {
            setSelectedDatasetId(initialDatasetId);
          } else {
            // Find a perjalanan_dinas dataset or first dataset
            const sppdDs = data.datasets.find((d: any) => d.category === 'perjalanan_dinas');
            if (sppdDs) {
              setSelectedDatasetId(sppdDs.id);
            } else if (data.datasets.length > 0) {
              setSelectedDatasetId(data.datasets[0].id);
            } else {
              loadFallbackSample();
            }
          }
        } else {
          loadFallbackSample();
        }
      })
      .catch(() => loadFallbackSample());
  }, [initialDatasetId]);

  const loadFallbackSample = () => {
    const sampleRows = samplePerjalananDinasData;
    const cols = Object.keys(sampleRows[0]);
    setCurrentColumns(cols);
    setRows(sampleRows);
    autoDetectMapping(cols);
  };

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

  // Auto-detect mappings for Travel orders
  const autoDetectMapping = (cols: string[]) => {
    const findCol = (terms: string[]) => {
      return cols.find(c => terms.some(t => c.toLowerCase().includes(t.toLowerCase()))) || '';
    };

    setMapping({
      namaColumn: findCol(['nama', 'pegawai', 'nama_pegawai']) || cols[1] || '',
      nipColumn: findCol(['nip', 'nomor_induk', 'id_pegawai']) || cols[0] || '',
      suratTugasColumn: findCol(['surat_tugas', 'st', 'nomor_surat', 'no_st', 'nomor_st', 'sppd']) || cols[2] || '',
      tanggalBerangkatColumn: findCol(['tgl_berangkat', 'tanggal_berangkat', 'berangkat', 'mulai', 'start']) || cols[3] || '',
      tanggalKembaliColumn: findCol(['tgl_kembali', 'tanggal_kembali', 'kembali', 'selesai', 'end']) || cols[4] || '',
      dinasColumn: findCol(['dinas', 'instansi', 'unit_kerja', 'opd', 'skpd']) || ''
    });
  };

  // Run overlap detection
  const { overlapCases, summary, allDinasList } = useMemo(() => {
    if (!mapping.tanggalBerangkatColumn || (!mapping.nipColumn && !mapping.namaColumn)) {
      return {
        overlapCases: [],
        summary: { totalPegawaiTerlibat: 0, totalKasusIrisan: 0, totalHariIrisan: 0, daftarDinas: [] },
        allDinasList: []
      };
    }

    return detectOverlaps(rows, mapping, selectedDinas);
  }, [rows, mapping, selectedDinas]);

  // Export results
  const handleExport = (type: 'excel' | 'csv') => {
    if (overlapCases.length === 0) return;

    const exportData: Record<string, any>[] = [];

    overlapCases.forEach((item, idx) => {
      exportData.push({
        'No': idx + 1,
        'NIP': item.nip || '-',
        'Nama Pegawai': item.nama,
        'Dinas / Unit Kerja': item.dinas || '-',
        'Jumlah Surat Tugas Bertabrakan': item.nomorSTTerlibat.length,
        'Daftar Nomor Surat Tugas': item.nomorSTTerlibat.join('; '),
        'Jumlah Hari Irisan (Overlap)': item.jumlahHariIrisan,
        'Tanggal Irisan': item.overlappingDates.map(d => formatDateIndo(d)).join(', '),
        'Rincian Periode Surat Tugas': item.suratTugasList.map(st => 
          `${st.nomorST} (${formatDateIndo(st.tanggalBerangkat)} s/d ${formatDateIndo(st.tanggalKembali)})`
        ).join(' | ')
      });
    });

    const filename = `hasil_deteksi_irisan_sppd_${Date.now()}`;
    if (type === 'excel') {
      exportToExcel(exportData, `${filename}.xlsx`);
    } else {
      exportToCsv(exportData, `${filename}.csv`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <GitFork className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              Menu Kolom Irisan (Deteksi Perjalanan Dinas Bertabrakan)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Analisis benturan tanggal perjalanan dinas & surat tugas (SPPD) per pegawai, mendukung &gt; 2 surat tugas
          </p>
        </div>

        {/* Dataset selector & upload */}
        <div className="flex items-center gap-2">
          <select
            value={selectedDatasetId}
            onChange={(e) => setSelectedDatasetId(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white shadow-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 max-w-xs"
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.row_count} baris)
              </option>
            ))}
            {datasets.length === 0 && (
              <option value="">Sample Data Perjalanan Dinas</option>
            )}
          </select>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-purple-600 text-white hover:bg-purple-700 shadow-xs transition"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload File
          </button>
        </div>
      </div>

      {/* Mapping Configuration & Filter Dinas */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Mapping Kolom Surat Tugas & Filter Instansi/Dinas
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Sistem secara otomatis mendeteksi format tanggal (YYYY-MM-DD, DD/MM/YYYY, teks, atau Excel)
          </span>
        </div>

        {/* Select Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              1. Kolom Nama Pegawai
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
              2. Kolom NIP Pegawai
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
              3. Kolom Nomor Surat Tugas (ST)
            </label>
            <select
              value={mapping.suratTugasColumn}
              onChange={(e) => setMapping(prev => ({ ...prev, suratTugasColumn: e.target.value }))}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
            >
              <option value="">Pilih Kolom Surat Tugas</option>
              {currentColumns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              4. Kolom Tanggal Berangkat
            </label>
            <select
              value={mapping.tanggalBerangkatColumn}
              onChange={(e) => setMapping(prev => ({ ...prev, tanggalBerangkatColumn: e.target.value }))}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
            >
              <option value="">Pilih Kolom Tgl Berangkat</option>
              {currentColumns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              5. Kolom Tanggal Kembali / Selesai
            </label>
            <select
              value={mapping.tanggalKembaliColumn}
              onChange={(e) => setMapping(prev => ({ ...prev, tanggalKembaliColumn: e.target.value }))}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
            >
              <option value="">Pilih Kolom Tgl Kembali</option>
              {currentColumns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              6. Kolom Dinas / Instansi (Opsional)
            </label>
            <select
              value={mapping.dinasColumn || ''}
              onChange={(e) => setMapping(prev => ({ ...prev, dinasColumn: e.target.value }))}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
            >
              <option value="">(Opsional) Pilih Kolom Dinas</option>
              {currentColumns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Dinas Filter Selector */}
        {allDinasList.length > 0 && (
          <div className="pt-2 flex items-center gap-3 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-600" />
              Filter Berdasarkan Dinas:
            </span>
            <select
              value={selectedDinas}
              onChange={(e) => setSelectedDinas(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium focus:bg-white"
            >
              <option value="ALL">Semua Instansi / Dinas ({rows.length} total baris)</option>
              {allDinasList.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pegawai Terdeteksi Bertabrakan</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-700">
            {summary.totalPegawaiTerlibat} <span className="text-xs font-normal text-slate-500">pegawai</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Memiliki 2 atau lebih surat tugas bertabrakan
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Kasus Irisan Surat Tugas</span>
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-red-600">
            {summary.totalKasusIrisan} <span className="text-xs font-normal text-slate-500">kasus</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Tumpang tindih jadwal perjalanan dinas
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Hari Tumpang Tindih</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {summary.totalHariIrisan} <span className="text-xs font-normal text-slate-500">hari total</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Hari di mana pegawai memiliki &gt;1 surat tugas
          </div>
        </div>
      </div>

      {/* Main Results Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Hasil Analisis Kolom Irisan Jadwal Perjalanan</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                {overlapCases.length} Kasus Ditemukan
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rincian pegawai, surat tugas tumpang tindih, dan tanggal irisan
            </p>
          </div>

          {/* Export buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('excel')}
              disabled={overlapCases.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" /> Download Laporan (.xlsx)
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={overlapCases.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-40 shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Memuat dan menganalisis irisan perjalanan dinas...
          </div>
        ) : overlapCases.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              Tidak Ada Jadwal Perjalanan Bertabrakan
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Semua surat tugas pada dataset atau dinas terpilih memiliki rentang tanggal yang aman dan terpisah.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {overlapCases.map((c, idx) => (
              <div key={idx} className="p-5 hover:bg-purple-50/20 transition">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left: Person Information */}
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{c.nama}</h4>
                      {c.nip && (
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          NIP: {c.nip}
                        </span>
                      )}
                    </div>
                    {c.dinas && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 pl-8">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {c.dinas}
                      </p>
                    )}

                    {/* Overlap Summary Badge */}
                    <div className="pl-8 pt-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          Beririsan selama <span className="font-bold underline">{c.jumlahHariIrisan} Hari</span> ({c.nomorSTTerlibat.length} Surat Tugas Bertabrakan)
                        </span>
                      </div>
                      <div className="mt-2 text-[11px] text-slate-600">
                        <span className="font-semibold text-slate-800">Tanggal Tumpang Tindih:</span>{' '}
                        {c.overlappingDates.map((d, dIdx) => (
                          <span key={dIdx} className="inline-block px-1.5 py-0.5 bg-red-100/80 text-red-900 rounded-sm font-mono mr-1 mb-1 font-semibold">
                            {formatDateIndo(d)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Conflicting Travel Orders Breakdown */}
                  <div className="flex-1 lg:max-w-xl space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Rincian Surat Tugas Yang Terlibat ({c.suratTugasList.length} ST):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {c.suratTugasList.map((st, stIdx) => (
                        <div key={stIdx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-indigo-700 flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" />
                              {st.nomorST}
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold bg-white px-1.5 py-0.5 rounded-sm border border-slate-200">
                              {st.durasiHari} Hari
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 flex items-center gap-1 pt-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>
                              {formatDateIndo(st.tanggalBerangkat)} &rarr; {formatDateIndo(st.tanggalKembali)}
                            </span>
                          </div>
                          {st.rawRow['TUJUAN'] && (
                            <div className="text-[10px] text-slate-500 truncate pt-0.5">
                              Tujuan: {st.rawRow['TUJUAN']}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        defaultCategory="perjalanan_dinas"
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

export default function KolomIrisanPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Memuat Menu Kolom Irisan...</div>}>
      <KolomIrisanContent />
    </Suspense>
  );
}
