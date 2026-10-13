-- ==============================================================================
-- DATABASE SCHEMA: SISTEM FILTER CSV, AUDIT TUNJANGAN & KOLOM IRISAN SPPD
-- Untuk Supabase (PostgreSQL)
-- ==============================================================================

-- 1. Tabel Utama: datasets
-- Menyimpan metadata file CSV / Excel yang diupload pengguna
CREATE TABLE IF NOT EXISTS datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'csv',
    category TEXT DEFAULT 'general',
    columns JSONB NOT NULL DEFAULT '[]'::jsonb,
    row_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Baris Data: dataset_rows
-- Menyimpan setiap baris data dalam format JSONB dinamis, sehingga fleksibel 
-- mendukung SEMUA kolom dari file CSV/Excel apapun tanpa mengubah struktur tabel
CREATE TABLE IF NOT EXISTS dataset_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    row_index INTEGER NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Indeks untuk Performa Tinggi (Pencarian & Filtering Cepat)
CREATE INDEX IF NOT EXISTS idx_dataset_rows_dataset_id ON dataset_rows(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_rows_data_gin ON dataset_rows USING gin(data);
CREATE INDEX IF NOT EXISTS idx_datasets_created_at ON datasets(created_at DESC);

-- 4. Row Level Security (RLS)
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_rows ENABLE ROW LEVEL SECURITY;

-- Policy agar aplikasi dapat membaca dan menulis data
CREATE POLICY "Allow public read datasets" ON datasets
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert datasets" ON datasets
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update datasets" ON datasets
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete datasets" ON datasets
    FOR DELETE USING (true);

CREATE POLICY "Allow public read dataset_rows" ON dataset_rows
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert dataset_rows" ON dataset_rows
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete dataset_rows" ON dataset_rows
    FOR DELETE USING (true);

-- ==============================================================================
-- SELESAI. Silakan copy-paste script ini ke SQL Editor di Dashboard Supabase Anda.
-- ==============================================================================
