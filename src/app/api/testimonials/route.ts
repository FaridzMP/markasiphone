// src/app/api/testimonials/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// ─── Helper: cek apakah request dari admin ────────────────────────────────────
// Auth sistem Markas iPhone pakai localStorage (client-side only).
// Server tidak bisa baca localStorage — jadi kita pakai custom header
// yang dikirim dari semua fetch di admin page.
function isAdmin(req: NextRequest): boolean {
  // Cek custom header yang dikirim frontend admin
  const adminHeader = req.headers.get('x-admin-request');
  if (adminHeader === 'true') return true;

  // Fallback: cek query param (untuk GET)
  const { searchParams } = new URL(req.url);
  if (searchParams.get('admin') === 'true') return true;

  // Fallback: cek cookie (jika suatu saat diimplementasi)
  const cookie = req.cookies.get('markas_admin_logged_in')?.value;
  if (cookie === 'true') return true;

  return false;
}

async function savePhoto(file: File): Promise<string> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });
  const ext      = file.name.split('.').pop() ?? 'jpg';
  const filename = `testimoni_${Date.now()}.${ext}`;
  const buffer   = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminMode = isAdmin(req);
    const status    = searchParams.get('status');

    let query             = 'SELECT * FROM testimonials';
    const args: unknown[] = [];

    if (adminMode) {
      if (status && status !== 'all') {
        query += ' WHERE status = ?';
        args.push(status);
      }
      // tanpa filter = ambil semua
    } else {
      // Publik: hanya yang approved
      query += " WHERE status = 'approved'";
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await db.query(query, args);
    return NextResponse.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error('[GET /api/testimonials]', err);
    return NextResponse.json([], { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') ?? '';
    const adminPost   = isAdmin(req);

    let customer_name: string;
    let customer_email: string;
    let rating: number;
    let message: string;
    let photo_url: string | null = null;
    let status = 'pending';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      customer_name  = (formData.get('customer_name') as string)?.trim();
      customer_email = (formData.get('customer_email') as string)?.trim().toLowerCase();
      rating         = parseInt(formData.get('rating') as string, 10);
      message        = (formData.get('message') as string)?.trim();

      const photo = formData.get('photo') as File | null;
      if (photo && photo.size > 0) {
        if (photo.size > 5 * 1024 * 1024)
          return NextResponse.json({ success: false, message: 'Foto maksimal 5MB' }, { status: 400 });
        photo_url = await savePhoto(photo);
      }
    } else {
      const body     = await req.json();
      customer_name  = body.customer_name?.trim();
      customer_email = body.customer_email?.trim().toLowerCase();
      rating         = parseInt(body.rating, 10);
      message        = body.message?.trim();
      status         = body.status ?? 'pending';

      if (body.photo_url && typeof body.photo_url === 'string') {
        photo_url = body.photo_url;
      }
    }

    if (!customer_name || !customer_email || !rating || !message)
      return NextResponse.json({ success: false, message: 'Semua field wajib diisi' }, { status: 400 });

    if (rating < 1 || rating > 5)
      return NextResponse.json({ success: false, message: 'Rating harus antara 1–5' }, { status: 400 });

    // Cek order hanya untuk submission publik
    if (!adminPost) {
      const [orderRows] = await db.query(
        "SELECT id FROM orders WHERE LOWER(customer_email) = ? AND status != 'dibatalkan' LIMIT 1",
        [customer_email]
      ) as [Array<{ id: number }>, unknown];

      if (orderRows.length === 0)
        return NextResponse.json(
          { success: false, message: 'Email tidak ditemukan dalam riwayat pesanan.' },
          { status: 403 }
        );

      const [existing] = await db.query(
        "SELECT id FROM testimonials WHERE customer_email = ? AND status != 'rejected'",
        [customer_email]
      ) as [Array<{ id: number }>, unknown];

      if (existing.length > 0)
        return NextResponse.json(
          { success: false, message: 'Anda sudah pernah mengirim testimoni.' },
          { status: 409 }
        );
    }

    const [result] = await db.query(
      `INSERT INTO testimonials (customer_name, customer_email, rating, message, photo_url, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [customer_name, customer_email, rating, message, photo_url, status]
    ) as [{ insertId: number }, unknown];

    return NextResponse.json({ success: true, message: 'Testimoni berhasil ditambahkan!', id: result.insertId }, { status: 201 });

  } catch (err) {
    console.error('[POST /api/testimonials]', err);
    return NextResponse.json({ success: false, message: 'Gagal menyimpan testimoni' }, { status: 500 });
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req))
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { id } = body;

    if (!id)
      return NextResponse.json({ success: false, message: 'ID wajib ada' }, { status: 400 });

    // Case A: hanya update status (approve/reject dari action button)
    const isStatusOnly = Object.keys(body).length === 2 && 'status' in body;
    if (isStatusOnly) {
      if (!['approved', 'rejected', 'pending'].includes(body.status))
        return NextResponse.json({ success: false, message: 'Status tidak valid' }, { status: 400 });

      await db.query('UPDATE testimonials SET status = ? WHERE id = ?', [body.status, id]);
      return NextResponse.json({ success: true, message: 'Status berhasil diperbarui' });
    }

    // Case B: edit lengkap dari modal
    const { customer_name, customer_email, rating, message, photo_url, status } = body;

    if (!customer_name || !customer_email || !rating || !message)
      return NextResponse.json({ success: false, message: 'Field tidak lengkap' }, { status: 400 });

    await db.query(
      `UPDATE testimonials
       SET customer_name = ?, customer_email = ?, rating = ?, message = ?, photo_url = ?, status = ?
       WHERE id = ?`,
      [
        customer_name.trim(),
        customer_email.trim().toLowerCase(),
        rating,
        message.trim(),
        photo_url || null,
        status,
        id,
      ]
    );

    return NextResponse.json({ success: true, message: 'Testimoni berhasil diperbarui' });

  } catch (err) {
    console.error('[PATCH /api/testimonials]', err);
    return NextResponse.json({ success: false, message: 'Gagal update' }, { status: 500 });
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req))
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id)
      return NextResponse.json({ success: false, message: 'ID tidak valid' }, { status: 400 });

    await db.query('DELETE FROM testimonials WHERE id = ?', [id]);
    return NextResponse.json({ success: true, message: 'Testimoni berhasil dihapus' });

  } catch (err) {
    console.error('[DELETE /api/testimonials]', err);
    return NextResponse.json({ success: false, message: 'Gagal menghapus' }, { status: 500 });
  }
}