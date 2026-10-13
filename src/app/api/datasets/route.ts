import { NextRequest, NextResponse } from 'next/server';
import { getDatasets, saveDataset } from '@/lib/db';

export async function GET() {
  try {
    const datasets = await getDatasets();
    return NextResponse.json({ success: true, datasets });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, fileType, category, columns, rows } = body;

    if (!name || !columns || !rows) {
      return NextResponse.json(
        { error: 'Data file, kolom, dan baris wajib disertakan' },
        { status: 400 }
      );
    }

    const saved = await saveDataset(
      name,
      fileType || 'csv',
      category || 'general',
      columns,
      rows
    );

    return NextResponse.json({ success: true, dataset: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
