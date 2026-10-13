# DataFilter & Overlap Analytics System

Aplikasi Dashboard Fullstack untuk **Upload Data CSV/Excel ke Database Supabase**, **Filter Kolom Dinamis & Audit Tunjangan Keluarga**, serta **Deteksi Perjalanan Dinas / Surat Tugas yang Bertabrakan Waktu (Kolom Irisan)**.

Dibuat menggunakan **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase (PostgreSQL)**, dan siap di-deploy ke **Vercel**.

---

## Fitur Utama

### 1. Menu Filter Kolom & Audit Tunjangan Keluarga
* **Universal Dynamic Column Filtering**: Membaca seluruh kolom file CSV / Excel secara otomatis dan menyediakan filter per kolom secara real-time.
* **Audit Tunjangan Istri & Anak**:
  * Mengenali kode tunjangan: **10** (Istri/Suami), **11** (Anak ke-1), **12** (Anak ke-2), **13+** (Anak ke-3 dan seterusnya).
  * Menghitung pelanggaran kuota tunjangan anak (&gt; 2 anak).
  * Input parameter kustom untuk batas usia anak (default: 21 tahun).
  * Deteksi kepemilikan Surat Keterangan Sekolah/Kuliah aktif bagi anak.
  * **Kalkulasi Otomatis Kelebihan Bayar**: Menghitung total rupiah kelebihan penerimaan per pegawai (NIP) dan grand total.
* **Download Hasil**: Ekspor hasil filter dan laporan audit ke **Excel (.xlsx)** atau **CSV**.

### 2. Menu Kolom Irisan (Deteksi Benturan Jadwal SPPD)
* **Interactive Column Mapping**: Memilih kolom Nama, NIP, Nomor Surat Tugas, Tanggal Berangkat, Tanggal Kembali, dan Instansi/Dinas.
* **Deteksi Overlap Multi-Surat Tugas**:
  * Mendeteksi benturan jadwal antar 2, 3, atau lebih surat tugas untuk pegawai (NIP/Nama) yang sama.
  * Menghitung jumlah hari tumpang tindih dan mencantumkan rincian tanggal-tanggal benturan secara spesifik (misal: ST 1 tgl 1-3 Jan dan ST 2 tgl 2-5 Jan &rarr; beririsan pada 2 Jan dan 3 Jan).
* **Filter Instansi/Dinas**: Menganalisis per dinas tertentu maupun seluruh instansi.
* **Download Hasil**: Ekspor daftar kasus irisan ke **Excel (.xlsx)** atau **CSV**.

### 3. Autentikasi Mandiri via `.env`
* Keamanan dashboard terlindungi halaman login.
* Username dan password dikonfigurasi mandiri di file `.env` (`AUTH_USERNAME` dan `AUTH_PASSWORD`).

### 4. Supabase Database & Vercel Ready
* Skema database PostgreSQL dinamis (`JSONB` + GIN Index) yang siap menampung ribuan baris dengan ratusan kolom.
* Terintegrasi dengan Git repository dan siap deploy ke Vercel dengan satu klik.

---

## Panduan Instalasi & Penggunaan

### 1. Konfigurasi Environment (`.env.local` / `.env`)
Salin file `.env.example` menjadi `.env.local`:
```bash
AUTH_USERNAME=admin
AUTH_PASSWORD=admin123
SESSION_SECRET=kunci-rahasia-jwt-32-karakter-bebas

# Supabase Credentials (Dapatkan dari https://supabase.com)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Setup Database di Supabase
1. Buka [Dashboard Supabase](https://supabase.com) dan buat proyek baru.
2. Buka menu **SQL Editor** di sidebar kiri Supabase.
3. Buka file [`supabase/schema.sql`](supabase/schema.sql), copy seluruh isinya, dan klik **Run**.
4. Buka **Project Settings** > **API**, lalu salin:
   * **Project URL** &rarr; masukkan ke `NEXT_PUBLIC_SUPABASE_URL`
   * **anon public key** &rarr; masukkan ke `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Menjalankan Aplikasi Secara Lokal
```bash
npm run dev
```
Buka browser di `http://localhost:3000`. Anda akan diarahkan ke halaman login. Masukkan username dan password yang telah Anda tentukan di file `.env`.

---

## Cara Deploy ke Vercel

1. **Inisialisasi & Push ke GitHub**:
   ```bash
   git add .
   git commit -m "feat: Sistem DataFilter, Audit Tunjangan & Kolom Irisan"
   git remote add origin https://github.com/username-anda/repo-anda.git
   git branch -M main
   git push -u origin main
   ```

2. **Deploy di Vercel**:
   1. Buka [Vercel Dashboard](https://vercel.com) dan klik **Add New Project**.
   2. Import repository Git yang baru saja di-push.
   3. Pada bagian **Environment Variables**, tambahkan:
      * `AUTH_USERNAME` = `(username pilihan Anda)`
      * `AUTH_PASSWORD` = `(password pilihan Anda)`
      * `SESSION_SECRET` = `(string acak rahasia)`
      * `NEXT_PUBLIC_SUPABASE_URL` = `(URL Supabase)`
      * `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `(Anon Key Supabase)`
   4. Klik **Deploy**. Selesai! Aplikasi Anda langsung live di URL Vercel.
