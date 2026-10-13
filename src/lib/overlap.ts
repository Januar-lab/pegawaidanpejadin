import { OverlapCase, OverlapColumnMapping, OverlapSummary, SuratTugasItem } from '@/types';

// Helper to normalize dates into YYYY-MM-DD
export function parseDateToIso(dateVal: any): string | null {
  if (!dateVal) return null;

  // 1. If it's already an Excel serial date number (e.g. 45300)
  if (typeof dateVal === 'number' && dateVal > 20000 && dateVal < 60000) {
    const utc_days = Math.floor(dateVal - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().split('T')[0];
  }

  const str = String(dateVal).trim();
  if (!str) return null;

  // Try standard Date parsing
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    if (year >= 1990 && year <= 2100) {
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  // Indonesian / standard format: DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Parse Indonesian month names (e.g. "2 Januari 2026")
  const indoMonths: Record<string, string> = {
    januari: '01', jan: '01',
    februari: '02', feb: '02',
    maret: '03', mar: '03',
    april: '04', apr: '04',
    mei: '05', may: '05',
    juni: '06', jun: '06',
    juli: '07', jul: '07',
    agustus: '08', agu: '08', ags: '08',
    september: '09', sep: '09',
    oktober: '10', okt: '10',
    november: '11', nov: '11',
    desember: '12', des: '12'
  };

  const idMatch = str.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
  if (idMatch) {
    const day = idMatch[1].padStart(2, '0');
    const mStr = idMatch[2].toLowerCase();
    const year = idMatch[3];
    const month = indoMonths[mStr];
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  return null;
}

// Generate all individual dates between startDate and endDate inclusive
function getDatesInRange(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  const curr = new Date(startStr);
  const end = new Date(endStr);

  while (curr <= end) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

export function detectOverlaps(
  rows: Record<string, any>[],
  mapping: OverlapColumnMapping,
  filterDinas?: string
): { overlapCases: OverlapCase[]; summary: OverlapSummary; allDinasList: string[] } {
  // Extract all distinct Dinas values
  const dinasSet = new Set<string>();
  if (mapping.dinasColumn) {
    rows.forEach(r => {
      const val = String(r[mapping.dinasColumn!] || '').trim();
      if (val) dinasSet.add(val);
    });
  }

  // Group rows by person (NIP or Nama)
  const personMap = new Map<string, { nip: string; nama: string; dinas?: string; items: SuratTugasItem[] }>();

  rows.forEach(row => {
    const nip = String(row[mapping.nipColumn] || '').trim();
    const nama = String(row[mapping.namaColumn] || '').trim();
    const nomorST = String(row[mapping.suratTugasColumn] || '').trim();
    const rawStart = row[mapping.tanggalBerangkatColumn];
    const rawEnd = row[mapping.tanggalKembaliColumn];
    const dinas = mapping.dinasColumn ? String(row[mapping.dinasColumn] || '').trim() : undefined;

    // Optional dinas filter
    if (filterDinas && filterDinas !== 'ALL' && dinas && dinas !== filterDinas) {
      return;
    }

    const startIso = parseDateToIso(rawStart);
    const endIso = parseDateToIso(rawEnd) || startIso; // default end to start if single-day

    if (!nomorST || !startIso || !endIso) return;

    // Duration in days
    const sDate = new Date(startIso);
    const eDate = new Date(endIso);
    const diffTime = Math.max(0, eDate.getTime() - sDate.getTime());
    const durasiHari = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const key = nip || nama;
    if (!key) return;

    if (!personMap.has(key)) {
      personMap.set(key, { nip, nama, dinas, items: [] });
    }

    personMap.get(key)!.items.push({
      nomorST,
      tanggalBerangkat: startIso,
      tanggalKembali: endIso,
      durasiHari,
      dinas,
      rawRow: row
    });
  });

  const overlapCases: OverlapCase[] = [];

  // Analyze each person's travel orders
  personMap.forEach((person) => {
    if (person.items.length < 2) return;

    // Map each date to the list of STs covering that date
    const dateToSTs = new Map<string, Set<string>>();

    person.items.forEach(item => {
      const dates = getDatesInRange(item.tanggalBerangkat, item.tanggalKembali);
      dates.forEach(d => {
        if (!dateToSTs.has(d)) {
          dateToSTs.set(d, new Set<string>());
        }
        dateToSTs.get(d)!.add(item.nomorST);
      });
    });

    // Dates with >= 2 distinct Surat Tugas
    const overlappingDates: string[] = [];
    const involvedSTSet = new Set<string>();

    dateToSTs.forEach((stSet, dateStr) => {
      if (stSet.size >= 2) {
        overlappingDates.push(dateStr);
        stSet.forEach(st => involvedSTSet.add(st));
      }
    });

    if (overlappingDates.length > 0) {
      overlappingDates.sort();

      overlapCases.push({
        nip: person.nip,
        nama: person.nama,
        dinas: person.dinas,
        suratTugasList: person.items.filter(it => involvedSTSet.has(it.nomorST)),
        overlappingDates,
        jumlahHariIrisan: overlappingDates.length,
        nomorSTTerlibat: Array.from(involvedSTSet)
      });
    }
  });

  // Sort overlap cases by highest number of overlapping days
  overlapCases.sort((a, b) => b.jumlahHariIrisan - a.jumlahHariIrisan);

  // Compute summary metrics
  const uniquePersons = new Set(overlapCases.map(c => c.nip || c.nama));
  const totalHariIrisan = overlapCases.reduce((acc, c) => acc + c.jumlahHariIrisan, 0);

  const summary: OverlapSummary = {
    totalPegawaiTerlibat: uniquePersons.size,
    totalKasusIrisan: overlapCases.length,
    totalHariIrisan,
    daftarDinas: Array.from(dinasSet).sort()
  };

  return {
    overlapCases,
    summary,
    allDinasList: Array.from(dinasSet).sort()
  };
}
