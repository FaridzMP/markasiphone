import nodemailer from "nodemailer";
import { db } from "../../../lib/db";
import { NextRequest, NextResponse } from "next/server";

// Helper buat transporter email
function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      // Fix: gunakan EMAIL_PASSWORD sesuai .env.local
      pass: process.env.EMAIL_PASSWORD?.replace(/\s/g, ""),
    },
  });
}

// GET semua orders
// GET handler — tambah query params page & limit
export async function GET(req: NextRequest) {
  const isAdmin = req.headers.get("x-admin-request") === "true";
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get("page")  || "1"));
  const limit = Math.min(1000, parseInt(searchParams.get("limit") || "20"));
  const status = searchParams.get("status") || "";
  const search = searchParams.get("search") || "";
  const offset = (page - 1) * limit;

  // Build WHERE
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }
  if (search) {
    conditions.push("(customer_name LIKE ? OR customer_email LIKE ? OR phone LIKE ?)");
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [[{ total }]] = await db.query<any[]>(
    `SELECT COUNT(*) AS total FROM orders ${where}`,
    params
  );

  const [rows] = await db.query<any[]>(
    `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return NextResponse.json({
    data: rows,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST buat order baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer_name, customer_email, phone, address, product, total_price } = body;

    if (!customer_name || !customer_email || !phone || !address || !product || !total_price) {
      return Response.json(
        { message: "Data order belum lengkap" },
        { status: 400 }
      );
    }

    const [result]: any = await db.query(
      `INSERT INTO orders (customer_name, customer_email, phone, address, product, total_price)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [customer_name, customer_email, phone, address, product, total_price]
    );

    const orderId = result.insertId;

    // Kirim email — jika gagal, order tetap tersimpan
    try {
      const transporter = createTransporter();

      // Email ke admin
      await transporter.sendMail({
        from: `"Markas iPhone" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `Order Baru #${orderId} - ${customer_name}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; color: #111; max-width: 600px;">
            <h2 style="color: #1d4ed8;">Order Baru Masuk</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #666;">Order ID</td><td style="font-weight: bold;">#${orderId}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Nama</td><td style="font-weight: bold;">${customer_name}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Email</td><td>${customer_email}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">WhatsApp</td><td>${phone}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Alamat</td><td>${address}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Produk</td><td>${product}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Total</td><td style="font-weight: bold; font-size: 18px;">${total_price}</td></tr>
            </table>
          </div>
        `,
      });

      // Email invoice ke customer
      await transporter.sendMail({
        from: `"Markas iPhone" <${process.env.EMAIL_USER}>`,
        to: customer_email,
        subject: `Invoice Pesanan #${orderId} - Markas iPhone`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; color: #111; max-width: 600px;">
            <h2 style="color: #1d4ed8;">Invoice Pesanan Markas iPhone</h2>
            <p>Halo <b>${customer_name}</b>, terima kasih sudah memesan di Markas iPhone!</p>
            <div style="margin: 24px 0; padding: 20px; background: #f5f5f7; border-radius: 16px;">
              <p><b>Order ID:</b> #${orderId}</p>
              <p><b>Produk:</b> ${product}</p>
              <p><b>Total:</b> ${total_price}</p>
              <p><b>Status:</b> Menunggu Pembayaran</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0;"/>
              <p><b>Metode Pembayaran:</b> Transfer Bank BCA</p>
              <p><b>No. Rekening:</b> 1234567890 a.n. Markas iPhone</p>
            </div>
            <p>Kirim bukti transfer ke admin via WhatsApp setelah transfer.</p>
            <p>Salam,<br/><b>Markas iPhone</b></p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Gagal kirim email:", emailError);
      // Order tetap berhasil, hanya email yang gagal
      return Response.json({
        message: "Order berhasil dibuat. Email gagal terkirim, cek konfigurasi SMTP.",
        order_id: orderId,
        email_error: true,
      });
    }

    return Response.json({
      message: "Order berhasil dibuat dan email terkirim",
      order_id: orderId,
    });
  } catch (error) {
    return Response.json(
      { message: "Gagal membuat order", error: String(error) },
      { status: 500 }
    );
  }
}

// PATCH update status order
export async function PATCH(request: Request) {
  const req = request as NextRequest;
  if (req.headers.get("x-admin-request") !== "true") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return Response.json(
        { message: "ID dan status wajib ada" },
        { status: 400 }
      );
    }

    const validStatuses = ["pending", "diproses", "dikirim", "selesai", "dibatalkan"];
    if (!validStatuses.includes(status)) {
      return Response.json(
        { message: `Status tidak valid. Pilih: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    await db.query(`UPDATE orders SET status = ? WHERE id = ?`, [status, id]);

    // Kirim email konfirmasi jika status selesai
    if (status === "selesai") {
      try {
        const [rows]: any = await db.query(
          `SELECT * FROM orders WHERE id = ? LIMIT 1`,
          [id]
        );
        const order = rows[0];

        if (order?.customer_email) {
          const transporter = createTransporter();
          await transporter.sendMail({
            from: `"Markas iPhone" <${process.env.EMAIL_USER}>`,
            to: order.customer_email,
            subject: `Pesanan #${order.id} Selesai - Markas iPhone`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 24px; color: #111; max-width: 600px;">
                <h2 style="color: #16a34a;">✅ Pembayaran Dikonfirmasi</h2>
                <p>Halo <b>${order.customer_name}</b>, pembayaran kamu sudah kami terima!</p>
                <div style="margin: 24px 0; padding: 20px; background: #f0fdf4; border-radius: 16px; border: 1px solid #bbf7d0;">
                  <p><b>Order:</b> #${order.id}</p>
                  <p><b>Produk:</b> ${order.product}</p>
                  <p><b>Total:</b> ${order.total_price}</p>
                  <p><b>Status:</b> ✅ Selesai</p>
                  <p><b>Tanggal:</b> ${new Date(order.created_at).toLocaleString("id-ID")}</p>
                </div>
                <p>Terima kasih sudah berbelanja di Markas iPhone! 🙏</p>
                <p>Salam,<br/><b>Markas iPhone</b></p>
              </div>
            `,
          });
        }
      } catch (emailError) {
        console.error("Gagal kirim email konfirmasi:", emailError);
      }
    }

    return Response.json({ message: "Status order berhasil diupdate" });
  } catch (error) {
    return Response.json(
      { message: "Gagal update status", error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE hapus order
export async function DELETE(request: Request) {
  const req = request as NextRequest;
  if (req.headers.get("x-admin-request") !== "true") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ message: "ID order wajib ada" }, { status: 400 });
    }

    await db.query(`DELETE FROM orders WHERE id = ?`, [id]);

    return Response.json({ message: "Order berhasil dihapus" });
  } catch (error) {
    return Response.json(
      { message: "Gagal hapus order", error: String(error) },
      { status: 500 }
    );
  }
}