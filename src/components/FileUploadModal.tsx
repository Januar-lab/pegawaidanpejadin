'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, Check, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { parseFile } from '@/lib/fileParser';
import { sampleTunjanganData, samplePerjalananDinasData } from '@/lib/sampleData';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (dataset: any, rows: Record<string, any>[]) => void;
  defaultCategory?: 'general' | 'tunjangan' | 'perjalanan_dinas';
}

export default function FileUploadModal({
  isOpen,
  onClose,
  onSuccess,
  defaultCategory = 'general'
}: FileUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState<string>('');
  const [category, setCategory] = useState<'general' | 'tunjangan' | 'perjalanan_dinas'>(defaultCategory);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<{ columns: string[]; rowCount: number; rows: any[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setIsLoading(true);
    setFile(selectedFile);
    setDatasetName(selectedFile.name.replace(/\.[^/.]+$/, ''));

    try {
      const parsed = await parseFile(selectedFile);
      if (parsed.columns.length === 0 || parsed.rows.length === 0) {
        throw new Error('File tidak memiliki data atau baris kosong');
      }
      setParsedPreview({
        columns: parsed.columns,
        rowCount: parsed.rows.length,
        rows: parsed.rows
      });
    } catch (err: any) {
      setError(err.message || 'Gagal membaca file');
      setFile(null);
      setParsedPreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = (sampleType: 'tunjangan' | 'perjalanan_dinas') => {
    setError(null);
    if (sampleType === 'tunjangan') {
      const rows = sampleTunjanganData;
      const columns = Object.keys(rows[0]);
      setDatasetName('Sample Data Tunjangan Pegawai');
      setCategory('tunjangan');
      setParsedPreview({
        columns,
        rowCount: rows.length,
        rows
      });
    } else {
      const rows = samplePerjalananDinasData;
      const columns = Object.keys(rows[0]);
      setDatasetName('Sample Data Perjalanan Dinas SPPD');
      setCategory('perjalanan_dinas');
      setParsedPreview({
        columns,
        rowCount: rows.length,
        rows
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedPreview) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/datasets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: datasetName || 'Dataset Tanpa Judul',
          fileType: file ? file.name.split('.').pop() : 'csv',
          category,
          columns: parsedPreview.columns,
          rows: parsedPreview.rows
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan dataset ke database');

      onSuccess(data.dataset, parsedPreview.rows);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat upload');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-100 p-6 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Upload Dataset CSV / Excel</h3>
              <p className="text-xs text-slate-500">File akan otomatis diparse dan disimpan ke database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Quick Sample Data Buttons */}
          <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Coba Dengan Contoh Data Instan:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleLoadSample('tunjangan')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 text-slate-700 shadow-xs transition"
              >
                📊 Sample Tunjangan (Anak & Istri)
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('perjalanan_dinas')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 text-slate-700 shadow-xs transition"
              >
                🛫 Sample Irisan SPPD (1-3 Jan & 2-5 Jan)
              </button>
            </div>
          </div>

          {/* File Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-6 text-center cursor-pointer transition bg-slate-50/50 hover:bg-slate-50"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {file ? file.name : 'Klik untuk memilih file CSV atau Excel (.xlsx, .xls)'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Maksimum 50 MB. Mendukung semua kolom data tanpa batas.
            </p>
          </div>

          {/* Dataset Name & Category */}
          {parsedPreview && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Dataset
                </label>
                <input
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  required
                  placeholder="Contoh: Data Tunjangan Pegawai 2026"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Analisis
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="general">Umum (Filter Kolom Bebas)</option>
                  <option value="tunjangan">Tunjangan Istri & Anak (Audit Kelebihan)</option>
                  <option value="perjalanan_dinas">Perjalanan Dinas (Deteksi Irisan Tanggal SPPD)</option>
                </select>
              </div>

              {/* Preview Info */}
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
                <div className="flex justify-between font-medium">
                  <span>Jumlah Baris Terbaca:</span>
                  <span className="font-bold">{parsedPreview.rowCount} baris</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Jumlah Kolom:</span>
                  <span className="font-bold">{parsedPreview.columns.length} kolom</span>
                </div>
                <div className="pt-1 text-[11px] text-slate-600 truncate">
                  <span className="font-semibold">Kolom:</span> {parsedPreview.columns.slice(0, 7).join(', ')}
                  {parsedPreview.columns.length > 7 ? ` (+${parsedPreview.columns.length - 7} lainnya)` : ''}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || !parsedPreview}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan ke Database...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan ke Database</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
