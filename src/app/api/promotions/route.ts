import { db } from "../../../lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

type PromotionRow = {
  id: number;
  product_id: number;
  discount_percent: number;
  is_active: number;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
  product_name?: string;
  product_image?: string;
  base_price?: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isExpired(validUntil: string | null): boolean {
  if (!validUntil) return false;
  return new Date(validUntil).getTime() < Date.now();
}

// GET semua promo, lengkap dengan info produk terkait
export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT
        promo.id,
        promo.product_id,
        promo.discount_percent,
        promo.is_active,
        promo.valid_until,
        promo.created_at,
        promo.updated_at,
        p.name AS product_name,
        p.image_url AS product_image,
        p.base_price
      FROM promotions promo
      JOIN products p ON p.id = promo.product_id
      ORDER BY promo.created_at DESC
    `);

    // Tandai status efektif (aktif tapi sudah lewat valid_until = dianggap expired)
    const enriched = (rows as PromotionRow[]).map((row) => ({
      ...row,
      is_expired: isExpired(row.valid_until),
    }));

    return Response.json(enriched);
  } catch (error) {
    return Response.json(
      { message: "Gagal mengambil data promosi", error: String(error) },
      { status: 500 }
    );
  }
}

// POST tambah promo baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { product_id, discount_percent, valid_until } = body;

    if (!product_id || !discount_percent) {
      return Response.json(
        { message: "Produk dan persentase diskon wajib diisi" },
        { status: 400 }
      );
    }

    if (discount_percent <= 0 || discount_percent > 90) {
      return Response.json(
        { message: "Diskon harus antara 1% - 90%" },
        { status: 400 }
      );
    }

    // Pastikan produk ada
    const [productRows]: any = await db.query(
      `SELECT id FROM products WHERE id = ? LIMIT 1`,
      [product_id]
    );
    if (productRows.length === 0) {
      return Response.json({ message: "Produk tidak ditemukan" }, { status: 404 });
    }

    // Enforce: 1 produk maksimal 1 promo aktif.
    // Kalau sudah ada promo aktif untuk produk ini, nonaktifkan dulu sebelum buat yang baru.
    const [existingActive]: any = await db.query(
      `SELECT id FROM promotions WHERE product_id = ? AND is_active = 1 LIMIT 1`,
      [product_id]
    );
    if (existingActive.length > 0) {
      return Response.json(
        { message: "Produk ini sudah punya promo aktif. Nonaktifkan promo lama dulu sebelum menambah yang baru." },
        { status: 409 }
      );
    }

    await db.query(
      `
      INSERT INTO promotions (product_id, discount_percent, valid_until, is_active)
      VALUES (?, ?, ?, 1)
      `,
      [product_id, Number(discount_percent), valid_until || null]
    );

    return Response.json({ message: "Promo berhasil ditambahkan" });
  } catch (error) {
    return Response.json(
      { message: "Gagal menambahkan promo", error: String(error) },
      { status: 500 }
    );
  }
}

// PATCH update promo (ubah persen, tanggal, atau toggle aktif/nonaktif)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, discount_percent, valid_until, is_active } = body;

    if (!id) {
      return Response.json({ message: "ID promo wajib ada" }, { status: 400 });
    }

    const [existingRows]: any = await db.query(
      `SELECT * FROM promotions WHERE id = ? LIMIT 1`,
      [id]
    );
    if (existingRows.length === 0) {
      return Response.json({ message: "Promo tidak ditemukan" }, { status: 404 });
    }
    const existing = existingRows[0];

    // Kalau sedang mengaktifkan promo ini, pastikan tidak ada promo aktif lain untuk produk yang sama
    if (is_active === true || is_active === 1) {
      const [otherActive]: any = await db.query(
        `SELECT id FROM promotions WHERE product_id = ? AND is_active = 1 AND id != ? LIMIT 1`,
        [existing.product_id, id]
      );
      if (otherActive.length > 0) {
        return Response.json(
          { message: "Produk ini sudah punya promo aktif lain. Nonaktifkan dulu sebelum mengaktifkan promo ini." },
          { status: 409 }
        );
      }
    }

    if (discount_percent !== undefined && (discount_percent <= 0 || discount_percent > 90)) {
      return Response.json({ message: "Diskon harus antara 1% - 90%" }, { status: 400 });
    }

    await db.query(
      `
      UPDATE promotions
      SET
        discount_percent = COALESCE(?, discount_percent),
        valid_until = ?,
        is_active = COALESCE(?, is_active)
      WHERE id = ?
      `,
      [
        discount_percent !== undefined ? Number(discount_percent) : null,
        valid_until !== undefined ? (valid_until || null) : existing.valid_until,
        is_active !== undefined ? (is_active ? 1 : 0) : null,
        id,
      ]
    );

    return Response.json({ message: "Promo berhasil diupdate" });
  } catch (error) {
    return Response.json(
      { message: "Gagal update promo", error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE hapus promo
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ message: "ID promo wajib ada" }, { status: 400 });
    }

    await db.query(`DELETE FROM promotions WHERE id = ?`, [id]);

    return Response.json({ message: "Promo berhasil dihapus" });
  } catch (error) {
    return Response.json(
      { message: "Gagal hapus promo", error: String(error) },
      { status: 500 }
    );
  }
}