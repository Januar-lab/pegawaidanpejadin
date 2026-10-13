import { NextRequest, NextResponse } from 'next/server';
import { validateCredentials, createSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password wajib diisi' },
        { status: 400 }
      );
    }

    const isValid = validateCredentials(username, password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Username atau password salah. Silakan periksa kembali konfigurasi .env Anda.' },
        { status: 401 }
      );
    }

    await createSession(username);

    return NextResponse.json({
      success: true,
      message: 'Login berhasil',
      user: { username }
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Terjadi kesalahan server saat login' },
      { status: 500 }
    );
  }
}
