import { supabase, isSupabaseConfigured } from './supabase';
import { Dataset, DatasetRow } from '@/types';

// In-memory fallback store if Supabase credentials are not yet entered in .env
let memoryDatasets: Dataset[] = [];
let memoryRows: Map<string, DatasetRow[]> = new Map();

export async function saveDataset(
  name: string,
  fileType: 'csv' | 'xlsx' | 'xls',
  category: 'general' | 'tunjangan' | 'perjalanan_dinas',
  columns: string[],
  rowsData: Record<string, any>[]
): Promise<Dataset> {
  const newId = crypto.randomUUID();
  const datasetMeta: Dataset = {
    id: newId,
    name,
    file_type: fileType,
    category,
    columns,
    row_count: rowsData.length,
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      // 1. Insert dataset metadata
      const { data: insertedDataset, error: dsErr } = await supabase
        .from('datasets')
        .insert({
          id: newId,
          name,
          file_type: fileType,
          category,
          columns,
          row_count: rowsData.length
        })
        .select()
        .single();

      if (dsErr) throw dsErr;

      // 2. Insert rows in chunks of 500 to avoid payload limits
      const chunkSize = 500;
      for (let i = 0; i < rowsData.length; i += chunkSize) {
        const chunk = rowsData.slice(i, i + chunkSize).map((row, idx) => ({
          dataset_id: newId,
          row_index: i + idx + 1,
          data: row
        }));

        const { error: rowsErr } = await supabase
          .from('dataset_rows')
          .insert(chunk);

        if (rowsErr) throw rowsErr;
      }

      return insertedDataset || datasetMeta;
    } catch (e: any) {
      console.warn('Supabase save error, falling back to local memory:', e.message);
      // Fallback to memory
      memoryDatasets.unshift(datasetMeta);
      memoryRows.set(newId, rowsData.map((data, idx) => ({
        id: crypto.randomUUID(),
        dataset_id: newId,
        row_index: idx + 1,
        data
      })));
      return datasetMeta;
    }
  } else {
    // Save to memory
    memoryDatasets.unshift(datasetMeta);
    memoryRows.set(newId, rowsData.map((data, idx) => ({
      id: crypto.randomUUID(),
      dataset_id: newId,
      row_index: idx + 1,
      data
    })));
    return datasetMeta;
  }
}

export async function getDatasets(): Promise<Dataset[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (e: any) {
      console.warn('Supabase fetch error, returning memory store:', e.message);
      return memoryDatasets;
    }
  }

  return memoryDatasets;
}

export async function getDatasetById(id: string): Promise<{ dataset: Dataset; rows: DatasetRow[] } | null> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: ds, error: dsErr } = await supabase
        .from('datasets')
        .select('*')
        .eq('id', id)
        .single();

      if (dsErr || !ds) return null;

      const { data: rows, error: rowsErr } = await supabase
        .from('dataset_rows')
        .select('*')
        .eq('dataset_id', id)
        .order('row_index', { ascending: true })
        .limit(10000); // large batch

      if (rowsErr) throw rowsErr;

      return {
        dataset: ds,
        rows: rows || []
      };
    } catch (e: any) {
      console.warn('Supabase get error, falling back to memory:', e.message);
      const ds = memoryDatasets.find(d => d.id === id);
      if (!ds) return null;
      return {
        dataset: ds,
        rows: memoryRows.get(id) || []
      };
    }
  }

  const ds = memoryDatasets.find(d => d.id === id);
  if (!ds) return null;
  return {
    dataset: ds,
    rows: memoryRows.get(id) || []
  };
}

export async function deleteDataset(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from('datasets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (e) {
      console.warn('Supabase delete error:', e);
    }
  }

  memoryDatasets = memoryDatasets.filter(d => d.id !== id);
  memoryRows.delete(id);
  return true;
}
