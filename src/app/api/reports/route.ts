import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";

function isAdmin(req: NextRequest) {
  return (
    req.headers.get("x-admin-request") === "true" ||
    req.nextUrl.searchParams.get("admin") === "true"
  );
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Semua query paralel
    const [
      [orders],
      [products],
      [keuangan],
      [modalRow],
      [promoActive],
    ] = await Promise.all([
      db.query<any[]>("SELECT * FROM orders"),
      db.query<any[]>("SELECT * FROM products"),
      db.query<any[]>("SELECT * FROM keuangan"),
      db.query<any[]>("SELECT total_modal FROM finance_settings WHERE id = 1"),
      db.query<any[]>("SELECT COUNT(*) AS cnt FROM promotions WHERE is_active = 1"),
    ]);

    // KPI Order
    const totalOrders = (orders as any[]).length;
    const ordersByStatus = ["pending","diproses","dikirim","selesai","dibatalkan"].map(st => ({
      status: st,
      count: (orders as any[]).filter((o: any) => o.status === st).length,
    }));

    // KPI Keuangan
    const totalRevenue = (keuangan as any[])
      .filter((k: any) => k.type === "income")
      .reduce((s: number, k: any) => s + Number(k.amount), 0);
    const totalExpense = (keuangan as any[])
      .filter((k: any) => k.type === "expense")
      .reduce((s: number, k: any) => s + Number(k.amount), 0);
    const netProfit  = totalRevenue - totalExpense;
    const totalModal = (modalRow as any[])[0]?.total_modal ?? 0;

    // KPI Produk
    const totalProducts    = (products as any[]).filter((p: any) => p.is_active).length;
    const lowStockProducts = (products as any[]).filter((p: any) => p.is_active && p.stock <= 5).length;

    // Revenue by month (6 bulan terakhir dari tabel keuangan income)
    const now = new Date();
    const revenueByMonth = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const y = d.getFullYear();
      const m = d.getMonth(); // 0-indexed
      const label = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });

      const revenue = (keuangan as any[])
        .filter((k: any) => {
          if (k.type !== "income") return false;
          const kd = new Date(k.created_at);
          return kd.getFullYear() === y && kd.getMonth() === m;
        })
        .reduce((s: number, k: any) => s + Number(k.amount), 0);

      const orderCount = (orders as any[]).filter((o: any) => {
        const od = new Date(o.created_at);
        return od.getFullYear() === y && od.getMonth() === m;
      }).length;

      return { month: label, revenue, orders: orderCount };
    });

    // Top produk berdasarkan kemunculan nama di order.product (simple text match)
    const productCountMap: Record<string, { count: number; revenue: number }> = {};
    (orders as any[]).forEach((o: any) => {
      const name = String(o.product ?? "").split("-")[0].trim();
      if (!name) return;
      if (!productCountMap[name]) productCountMap[name] = { count: 0, revenue: 0 };
      productCountMap[name].count++;
      const price = parseInt(String(o.total_price).replace(/\D/g, ""), 10) || 0;
      productCountMap[name].revenue += price;
    });

    const topProducts = Object.entries(productCountMap)
      .map(([name, val]) => ({ name, ...val }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      totalExpense,
      netProfit,
      totalModal,
      ordersByStatus,
      revenueByMonth,
      topProducts,
      totalProducts,
      lowStockProducts,
    });
  } catch (err) {
    console.error("Reports API error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}