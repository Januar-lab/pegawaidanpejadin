export const sampleTunjanganData = [
  {
    "NIP": "198501152010011001",
    "NAMA_PEGAWAI": "Budi Santoso",
    "KODE_KELUARGA": 10,
    "NAMA_KELUARGA": "Siti Rahmawati",
    "USIA": 38,
    "SURAT_KULIAH": "-",
    "NILAI_TUNJANGAN": 350000,
    "UNIT_KERJA": "Badan Kepegawaian Daerah"
  },
  {
    "NIP": "198501152010011001",
    "NAMA_PEGAWAI": "Budi Santoso",
    "KODE_KELUARGA": 11,
    "NAMA_KELUARGA": "Ahmad Pratama",
    "USIA": 15,
    "SURAT_KULIAH": "Ada",
    "NILAI_TUNJANGAN": 175000,
    "UNIT_KERJA": "Badan Kepegawaian Daerah"
  },
  {
    "NIP": "198501152010011001",
    "NAMA_PEGAWAI": "Budi Santoso",
    "KODE_KELUARGA": 12,
    "NAMA_KELUARGA": "Aulia Putri",
    "USIA": 12,
    "SURAT_KULIAH": "-",
    "NILAI_TUNJANGAN": 175000,
    "UNIT_KERJA": "Badan Kepegawaian Daerah"
  },
  // Pegawai 2: Memiliki anak ke-3 (Kode 13 - Melebihi kuota 2 anak)
  {
    "NIP": "198203202008041002",
    "NAMA_PEGAWAI": "Drs. Hendra Gunawan",
    "KODE_KELUARGA": 10,
    "NAMA_KELUARGA": "Dewi Sartika",
    "USIA": 41,
    "SURAT_KULIAH": "-",
    "NILAI_TUNJANGAN": 420000,
    "UNIT_KERJA": "Dinas Pendidikan"
  },
  {
    "NIP": "198203202008041002",
    "NAMA_PEGAWAI": "Drs. Hendra Gunawan",
    "KODE_KELUARGA": 11,
    "NAMA_KELUARGA": "Rian Gunawan",
    "USIA": 19,
    "SURAT_KULIAH": "Ada",
    "NILAI_TUNJANGAN": 210000,
    "UNIT_KERJA": "Dinas Pendidikan"
  },
  {
    "NIP": "198203202008041002",
    "NAMA_PEGAWAI": "Drs. Hendra Gunawan",
    "KODE_KELUARGA": 12,
    "NAMA_KELUARGA": "Dina Gunawan",
    "USIA": 16,
    "SURAT_KULIAH": "Ada",
    "NILAI_TUNJANGAN": 210000,
    "UNIT_KERJA": "Dinas Pendidikan"
  },
  {
    "NIP": "198203202008041002",
    "NAMA_PEGAWAI": "Drs. Hendra Gunawan",
    "KODE_KELUARGA": 13,
    "NAMA_KELUARGA": "Farhan Gunawan",
    "USIA": 10,
    "SURAT_KULIAH": "Ada",
    "NILAI_TUNJANGAN": 210000, // Kelebihan tunjangan (anak ke-3)
    "UNIT_KERJA": "Dinas Pendidikan"
  },
  // Pegawai 3: Anak melebihi batas usia (Usia 23 tahun tanpa surat kuliah)
  {
    "NIP": "197805122005011003",
    "NAMA_PEGAWAI": "Ir. Joko Sutrisno",
    "KODE_KELUARGA": 10,
    "NAMA_KELUARGA": "Endang Susilowati",
    "USIA": 46,
    "SURAT_KULIAH": "-",
    "NILAI_TUNJANGAN": 450000,
    "UNIT_KERJA": "Dinas Pekerjaan Umum"
  },
  {
    "NIP": "197805122005011003",
    "NAMA_PEGAWAI": "Ir. Joko Sutrisno",
    "KODE_KELUARGA": 11,
    "NAMA_KELUARGA": "Bagas Sutrisno",
    "USIA": 24, // Melebihi usia 21 thn dan tidak ada surat
    "SURAT_KULIAH": "Tidak Ada",
    "NILAI_TUNJANGAN": 225000, // Kelebihan usia
    "UNIT_KERJA": "Dinas Pekerjaan Umum"
  },
  {
    "NIP": "197805122005011003",
    "NAMA_PEGAWAI": "Ir. Joko Sutrisno",
    "KODE_KELUARGA": 12,
    "NAMA_KELUARGA": "Nabila Sutrisno",
    "USIA": 18,
    "SURAT_KULIAH": "Ada",
    "NILAI_TUNJANGAN": 225000,
    "UNIT_KERJA": "Dinas Pekerjaan Umum"
  },
  // Pegawai 4: Anak usia 22 thn punya surat kuliah (Valid)
  {
    "NIP": "198007252006042004",
    "NAMA_PEGAWAI": "Sri Wahyuni, S.Sos",
    "KODE_KELUARGA": 10,
    "NAMA_KELUARGA": "Agus Salim",
    "USIA": 44,
    "SURAT_KULIAH": "-",
    "NILAI_TUNJANGAN": 380000,
    "UNIT_KERJA": "Inspektorat Daerah"
  },
  {
    "NIP": "198007252006042004",
    "NAMA_PEGAWAI": "Sri Wahyuni, S.Sos",
    "KODE_KELUARGA": 11,
    "NAMA_KELUARGA": "Clara Salim",
    "USIA": 20,
    "SURAT_KULIAH": "Ada",
    "NILAI_TUNJANGAN": 190000,
    "UNIT_KERJA": "Inspektorat Daerah"
  }
];

export const samplePerjalananDinasData = [
  // Pegawai 1: Muhammad Rifai - Irisan 2 Surat Tugas (Contoh prompt: 1-3 Jan & 2-5 Jan)
  {
    "NIP": "198704122011011005",
    "NAMA": "Muhammad Rifai",
    "NOMOR_SURAT_TUGAS": "ST/090/01/2026",
    "TGL_BERANGKAT": "2026-01-01",
    "TGL_KEMBALI": "2026-01-03",
    "TUJUAN": "Jakarta - Rakor Nasional",
    "DINAS": "Dinas Komunikasi dan Informatika"
  },
  {
    "NIP": "198704122011011005",
    "NAMA": "Muhammad Rifai",
    "NOMOR_SURAT_TUGAS": "ST/115/02/2026",
    "TGL_BERANGKAT": "2026-01-02",
    "TGL_KEMBALI": "2026-01-05",
    "TUJUAN": "Bandung - Bimtek Keamanan Siber",
    "DINAS": "Dinas Komunikasi dan Informatika"
  },
  // Pegawai 2: Rina Marlina - Irisan 3 Surat Tugas Sekaligus
  {
    "NIP": "199002182014022006",
    "NAMA": "dr. Rina Marlina",
    "NOMOR_SURAT_TUGAS": "ST/KES/012/2026",
    "TGL_BERANGKAT": "2026-01-10",
    "TGL_KEMBALI": "2026-01-14",
    "TUJUAN": "Surabaya - Workshop Akreditasi",
    "DINAS": "Dinas Kesehatan"
  },
  {
    "NIP": "199002182014022006",
    "NAMA": "dr. Rina Marlina",
    "NOMOR_SURAT_TUGAS": "ST/KES/018/2026",
    "TGL_BERANGKAT": "2026-01-12",
    "TGL_KEMBALI": "2026-01-16",
    "TUJUAN": "Malang - Supervisi Faskes",
    "DINAS": "Dinas Kesehatan"
  },
  {
    "NIP": "199002182014022006",
    "NAMA": "dr. Rina Marlina",
    "NOMOR_SURAT_TUGAS": "ST/KES/025/2026",
    "TGL_BERANGKAT": "2026-01-13",
    "TGL_KEMBALI": "2026-01-15",
    "TUJUAN": "Yogyakarta - Evaluasi SPM",
    "DINAS": "Dinas Kesehatan"
  },
  // Pegawai 3: Bambang Wijaya - Tidak Ada Irisan (Normal)
  {
    "NIP": "198309102009031007",
    "NAMA": "Bambang Wijaya, M.Si",
    "NOMOR_SURAT_TUGAS": "ST/BAP/005/2026",
    "TGL_BERANGKAT": "2026-01-05",
    "TGL_KEMBALI": "2026-01-08",
    "TUJUAN": "Semarang - Musrenbangwil",
    "DINAS": "Bappeda"
  },
  {
    "NIP": "198309102009031007",
    "NAMA": "Bambang Wijaya, M.Si",
    "NOMOR_SURAT_TUGAS": "ST/BAP/019/2026",
    "TGL_BERANGKAT": "2026-01-20",
    "TGL_KEMBALI": "2026-01-22",
    "TUJUAN": "Jakarta - Konsultasi Bappenas",
    "DINAS": "Bappeda"
  },
  // Pegawai 4: Siti Nurhaliza - Irisan 2 Surat Tugas
  {
    "NIP": "199211052016012008",
    "NAMA": "Siti Nurhaliza, S.Pd",
    "NOMOR_SURAT_TUGAS": "ST/DISDIK/040/2026",
    "TGL_BERANGKAT": "2026-01-15",
    "TGL_KEMBALI": "2026-01-18",
    "TUJUAN": "Solo - Pelatihan Kurikulum",
    "DINAS": "Dinas Pendidikan"
  },
  {
    "NIP": "199211052016012008",
    "NAMA": "Siti Nurhaliza, S.Pd",
    "NOMOR_SURAT_TUGAS": "ST/DISDIK/044/2026",
    "TGL_BERANGKAT": "2026-01-17",
    "TGL_KEMBALI": "2026-01-20",
    "TUJUAN": "Semarang - Olimpiade Sains",
    "DINAS": "Dinas Pendidikan"
  }
];
