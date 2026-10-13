import { NextRequest, NextResponse } from 'next/server';
import { getDatasetById, deleteDataset } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getDatasetById(id);

    if (!result) {
      return NextResponse.json({ error: 'Dataset tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      dataset: result.dataset,
      rows: result.rows
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteDataset(id);
    return NextResponse.json({ success: true, message: 'Dataset berhasil dihapus' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
