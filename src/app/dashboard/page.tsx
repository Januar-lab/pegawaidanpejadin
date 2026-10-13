'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Filter, 
  GitFork, 
  Upload, 
  Database, 
  Trash2, 
  ArrowRight, 
  FileSpreadsheet, 
  Calendar, 
  Layers, 
  ShieldAlert, 
  CheckCircle,
  ExternalLink,
  Table
} from 'lucide-react';
import { Dataset } from '@/types';
import FileUploadModal from '@/components/FileUploadModal';

export default function DashboardPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [uploadCategory, setUploadCategory] = useState<'general' | 'tunjangan' | 'perjalanan_dinas'>('general');

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/datasets');
      const data = await res.json();
      if (data.success) {
        setDatasets(data.datasets);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus dataset "${name}" dari database?`)) return;
    try {
      const res = await fetch(`/api/datasets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDatasets(prev => prev.filter(d => d.id !== id));
      }
    } catch (err) {
      alert('Gagal menghapus dataset');
    }
  };

  const handleOpenUpload = (cat: 'general' | 'tunjangan' | 'perjalanan_dinas') => {
    setUploadCategory(cat);
    setIsUploadOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-linear-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/20 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 mb-3">
            <Database className="w-3.5 h-3.5" /> Database CSV & Overlap Engine
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang di Sistem Analisis Data
          </h1>
          <p className="text-sm text-indigo-100/90 mt-2 leading-relaxed">
            Upload file CSV atau Excel Anda ke database, filter data per kolom secara fleksibel, deteksi audit tunjangan istri & anak, serta temukan perjalanan dinas yang bertabrakan waktu secara otomatis.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => handleOpenUpload('general')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-xs transition shadow-md"
            >
              <Upload className="w-4 h-4" />
              Upload Data CSV / Excel Baru
            </button>
            <Link
              href="/dashboard/filter-kolom"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition backdrop-blur-xs border border-white/20"
            >
              <Filter className="w-4 h-4" />
              Buka Filter Kolom
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Menu Filter Kolom & Audit Tunjangan */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition">
                <Filter className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700">
                Fitur Utama 1
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition">
              Menu Filter Kolom & Audit Tunjangan
            </h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Upload CSV/Excel, filter semua kolom secara dinamis, dan jalankan audit khusus tunjangan istri & anak (Kode 10, 11, 12, dst.). Hitung otomatis kelebihan bayar untuk anak &gt; 2, usia melebihi batas, dan tanpa surat kuliah aktif.
            </p>
            <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Membaca semua kolom data tanpa batas
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Input batas usia anak kustom & aturan kuota anak
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Kalkulasi kelebihan tunjangan & ekspor Excel/CSV
              </li>
            </ul>
          </div>
          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => handleOpenUpload('tunjangan')}
              className="text-xs font-semibold text-slate-600 hover:text-indigo-600 inline-flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5" /> Upload File
            </button>
            <Link
              href="/dashboard/filter-kolom"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 group-hover:translate-x-1 transition"
            >
              Masuk Menu Filter <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Card 2: Menu Kolom Irisan SPPD */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-105 transition">
                <GitFork className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700">
                Fitur Utama 2
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 group-hover:text-purple-600 transition">
              Menu Kolom Irisan (SPPD / Surat Tugas)
            </h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Mendeteksi perjalanan dinas dengan jadwal bertabrakan berdasarkan Nama, NIP, tanggal berangkat, dan tanggal kembali. Mendeteksi 2 hingga lebih dari 2 surat tugas yang tumpang tindih secara akurat.
            </p>
            <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Deteksi irisan multi-ST (2 atau lebih surat tugas)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Hitung jumlah hari & rincian tanggal tumpang tindih
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Filter berdasarkan dinas maupun seluruh data
              </li>
            </ul>
          </div>
          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => handleOpenUpload('perjalanan_dinas')}
              className="text-xs font-semibold text-slate-600 hover:text-purple-600 inline-flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5" /> Upload File
            </button>
            <Link
              href="/dashboard/kolom-irisan"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 group-hover:translate-x-1 transition"
            >
              Masuk Menu Irisan <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Database Datasets Section */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              Tabel & Dataset Tersimpan di Database
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola semua file CSV / Excel yang telah diupload ke database sistem
            </p>
          </div>
          <button
            onClick={() => handleOpenUpload('general')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Dataset
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Memuat daftar dataset dari database...
          </div>
        ) : datasets.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Table className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Belum ada dataset tersimpan di database</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Silakan klik tombol Upload di bawah atau pilih Contoh Data Instan untuk langsung mencoba sistem.
            </p>
            <button
              onClick={() => handleOpenUpload('general')}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
            >
              Upload atau Coba Contoh Data Sekarang
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Nama Dataset</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Jumlah Baris</th>
                  <th className="py-3 px-4">Jumlah Kolom</th>
                  <th className="py-3 px-4">Tanggal Dibuat</th>
                  <th className="py-3 px-4 text-right">Aksi Analisis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {datasets.map((ds) => (
                  <tr key={ds.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-800 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>{ds.name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        ds.category === 'tunjangan' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : ds.category === 'perjalanan_dinas'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {ds.category === 'tunjangan' ? 'Tunjangan' : ds.category === 'perjalanan_dinas' ? 'SPPD / Irisan' : 'Umum'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{ds.row_count} baris</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{ds.columns?.length || 0} kolom</td>
                    <td className="py-3.5 px-4 text-slate-500">{new Date(ds.created_at).toLocaleDateString('id-ID')}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/filter-kolom?datasetId=${ds.id}`}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition inline-flex items-center gap-1"
                        >
                          <Filter className="w-3 h-3" /> Filter
                        </Link>
                        <Link
                          href={`/dashboard/kolom-irisan?datasetId=${ds.id}`}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition inline-flex items-center gap-1"
                        >
                          <GitFork className="w-3 h-3" /> Irisan
                        </Link>
                        <button
                          onClick={() => handleDelete(ds.id, ds.name)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                          title="Hapus dataset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        defaultCategory={uploadCategory}
        onSuccess={() => fetchDatasets()}
      />
    </div>
  );
}
