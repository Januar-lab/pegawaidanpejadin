import { TunjanganAuditRow, TunjanganColumnMapping, TunjanganSummary } from '@/types';

export interface AuditConfig {
  maxUsiaAnak: number; // default: 21
  maxJumlahAnak: number; // default: 2
  cekSuratKuliah: boolean; // default: true
}

export function auditTunjanganData(
  rows: Record<string, any>[],
  mapping: TunjanganColumnMapping,
  config: AuditConfig = { maxUsiaAnak: 21, maxJumlahAnak: 2, cekSuratKuliah: true }
): { auditRows: TunjanganAuditRow[]; summary: TunjanganSummary } {
  const auditRows: TunjanganAuditRow[] = [];
  
  // Track children count per NIP
  const nipChildrenCount: Record<string, number> = {};

  rows.forEach((row, index) => {
    const nip = String(row[mapping.nipColumn] || '').trim();
    const nama = String(row[mapping.namaColumn] || '').trim();
    const rawKode = String(row[mapping.kodeTunjanganColumn] ?? '').trim();
    const rawNilai = row[mapping.nilaiTunjanganColumn];
    
    // Parse nominal tunjangan
    let nilaiTunjangan = 0;
    if (typeof rawNilai === 'number') {
      nilaiTunjangan = rawNilai;
    } else if (typeof rawNilai === 'string') {
      // Remove Rp, commas, dots
      const cleanNum = rawNilai.replace(/[^0-9.-]+/g, '');
      nilaiTunjangan = parseFloat(cleanNum) || 0;
    }

    // Determine hubungan & child sequence
    let hubungan = 'Lainnya';
    let kodeNum = parseInt(rawKode, 10);
    let isAnak = false;
    let isIstri = false;
    let urutanAnak = 0;

    if (rawKode === '10' || rawKode.toLowerCase().includes('istri') || rawKode.toLowerCase().includes('suami')) {
      hubungan = 'Istri/Suami';
      isIstri = true;
    } else if (kodeNum >= 11 && kodeNum <= 99) {
      isAnak = true;
      urutanAnak = kodeNum - 10;
      hubungan = `Anak ke-${urutanAnak}`;
    } else if (rawKode.toLowerCase().includes('anak')) {
      isAnak = true;
      // Try extract number
      const match = rawKode.match(/\d+/);
      urutanAnak = match ? parseInt(match[0], 10) : 1;
      hubungan = `Anak ke-${urutanAnak}`;
    }

    // Parse age or calculate from birth date
    let usiaAnak: number | null = null;
    const rawUsia = row[mapping.usiaAnakColumn];
    if (rawUsia !== undefined && rawUsia !== null && rawUsia !== '') {
      if (typeof rawUsia === 'number') {
        usiaAnak = rawUsia;
      } else {
        const numUsia = parseFloat(String(rawUsia).trim());
        if (!isNaN(numUsia) && numUsia > 0 && numUsia < 100) {
          usiaAnak = numUsia;
        } else {
          // Try parse date
          const birthDate = new Date(String(rawUsia));
          if (!isNaN(birthDate.getTime())) {
            const ageDiffMs = Date.now() - birthDate.getTime();
            const ageDate = new Date(ageDiffMs);
            usiaAnak = Math.abs(ageDate.getUTCFullYear() - 1970);
          }
        }
      }
    }

    // Parse status surat kuliah
    const rawSurat = String(row[mapping.suratKuliahColumn] ?? '').trim().toLowerCase();
    const hasSurat = (
      rawSurat === 'ada' || 
      rawSurat === 'ya' || 
      rawSurat === '1' || 
      rawSurat === 'true' || 
      rawSurat === 'aktif' || 
      rawSurat === 'lengkap'
    );
    const statusSuratText = rawSurat ? (hasSurat ? 'Ada' : 'Tidak Ada') : 'Tidak Ada';

    // Track children sequence per NIP if applicable
    if (isAnak && nip) {
      nipChildrenCount[nip] = (nipChildrenCount[nip] || 0) + 1;
      if (!urutanAnak || urutanAnak === 0) {
        urutanAnak = nipChildrenCount[nip];
        hubungan = `Anak ke-${urutanAnak}`;
      }
    }

    // Violations detection
    const alasanKelebihan: string[] = [];
    let isAnakLebihDari2 = false;
    let isMelebihiUsia = false;
    let isTanpaSuratKuliah = false;
    let kelebihanTunjanganAnak = 0;
    let kelebihanTunjanganIstri = 0;

    if (isAnak) {
      // 1. Tunjangan anak lebih dari kuota (default > 2, e.g. kode 13, 14 dst atau urutan > 2)
      if (urutanAnak > config.maxJumlahAnak || kodeNum > (10 + config.maxJumlahAnak)) {
        isAnakLebihDari2 = true;
        alasanKelebihan.push(`Anak melebihi batas kuota (Anak ke-${urutanAnak} > maks ${config.maxJumlahAnak})`);
      }

      // 2. Melebihi usia yang ditentukan
      if (usiaAnak !== null && usiaAnak > config.maxUsiaAnak) {
        isMelebihiUsia = true;
        alasanKelebihan.push(`Usia anak (${usiaAnak} thn) melebihi batas maks ${config.maxUsiaAnak} thn`);
      }

      // 3. Tidak memiliki surat keterangan kuliah/sekolah (terutama bagi usia remaja/kuliah atau jika konfigurasi aktif)
      if (config.cekSuratKuliah && !hasSurat && usiaAnak !== null && usiaAnak >= 18) {
        isTanpaSuratKuliah = true;
        alasanKelebihan.push(`Tidak memiliki Surat Keterangan Kuliah/Sekolah aktif (Usia: ${usiaAnak} thn)`);
      }

      // If any violation, the allowance is an overpayment
      if (isAnakLebihDari2 || isMelebihiUsia || isTanpaSuratKuliah) {
        kelebihanTunjanganAnak = nilaiTunjangan;
      }
    }

    const totalKelebihan = kelebihanTunjanganAnak + kelebihanTunjanganIstri;

    auditRows.push({
      rowIndex: index + 1,
      nip,
      nama,
      kodeTunjangan: rawKode,
      hubungan,
      usiaAnak,
      statusSurat: statusSuratText,
      nilaiTunjangan,
      isAnakLebihDari2,
      isMelebihiUsia,
      isTanpaSuratKuliah,
      kelebihanTunjanganAnak,
      kelebihanTunjanganIstri,
      totalKelebihan,
      alasanKelebihan,
      originalRow: row
    });
  });

  // Calculate summary metrics
  const uniqueNIPs = new Set(auditRows.map(r => r.nip).filter(Boolean));
  const problemNIPs = new Set(auditRows.filter(r => r.totalKelebihan > 0).map(r => r.nip).filter(Boolean));

  let totalKelebihanNominal = 0;
  let totalKelebihanAnak = 0;
  let totalKelebihanIstri = 0;
  let jumlahKasusAnakLebih2 = 0;
  let jumlahKasusMelebihiUsia = 0;
  let jumlahKasusTanpaSurat = 0;

  for (const row of auditRows) {
    totalKelebihanNominal += row.totalKelebihan;
    totalKelebihanAnak += row.kelebihanTunjanganAnak;
    totalKelebihanIstri += row.kelebihanTunjanganIstri;
    if (row.isAnakLebihDari2) jumlahKasusAnakLebih2++;
    if (row.isMelebihiUsia) jumlahKasusMelebihiUsia++;
    if (row.isTanpaSuratKuliah) jumlahKasusTanpaSurat++;
  }

  const summary: TunjanganSummary = {
    totalPegawai: uniqueNIPs.size,
    totalPegawaiBermasalah: problemNIPs.size,
    totalKelebihanNominal,
    totalKelebihanAnak,
    totalKelebihanIstri,
    jumlahKasusAnakLebih2,
    jumlahKasusMelebihiUsia,
    jumlahKasusTanpaSurat
  };

  return { auditRows, summary };
}
