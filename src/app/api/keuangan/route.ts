import { NextRequest } from 'next/server';
import { db } from '../../../lib/db';

export async function GET() {
  try {
    const [rows]: any = await db.query(`
      SELECT * FROM keuangan
      ORDER BY created_at DESC
    `);

    // Di dalam GET() route.ts — ganti bagian totalModal
    const [financeRows]: any = await db.query(
      'SELECT total_modal FROM finance_settings WHERE id = 1 LIMIT 1'
    );
    const totalModal = financeRows.length > 0 ? Number(financeRows[0].total_modal) : 0;

    // Ambil total_modal dari kolom terpisah di tabel keuangan
    // (jika belum ada tabel finance_settings, kita skip dulu)
    const income = rows
      .filter((item: any) => item.type === 'income')
      .reduce((sum: number, item: any) => sum + Number(item.amount), 0);

    const expense = rows
      .filter((item: any) => item.type === 'expense')
      .reduce((sum: number, item: any) => sum + Number(item.amount), 0);

    return Response.json({
      transactions: rows,
      income,
      expense,
      totalModal: 0,       // sementara 0 sampai tabel finance_settings dibuat
      profit: income - expense,
    });
  } catch (error) {
    console.error('[GET /api/keuangan]', error);
    return Response.json(
      { message: 'Gagal mengambil data keuangan', error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, title, amount } = body;

    if (!type || !amount) {
      return Response.json({ message: 'type dan amount wajib diisi' }, { status: 400 });
    }

    await db.query(
      `INSERT INTO keuangan (type, description, amount) VALUES (?, ?, ?)`,
      [type, title ?? null, amount]   // kolom "title" di kode → "description" di DB
    );

    return Response.json({ message: 'Transaksi berhasil ditambahkan' });
  } catch (error) {
    console.error('[POST /api/keuangan]', error);
    return Response.json(
      { message: 'Gagal tambah transaksi', error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    
    let id: number | null = null;

    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      id = body.id;
    } else {
      const { searchParams } = new URL(request.url);
      id = Number(searchParams.get('id')) || null;
    }

    if (!id) {
      return Response.json({ success: false, message: 'ID tidak valid' }, { status: 400 });
    }

    await db.query(`DELETE FROM keuangan WHERE id = ?`, [id]);
    return Response.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/keuangan]', error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}