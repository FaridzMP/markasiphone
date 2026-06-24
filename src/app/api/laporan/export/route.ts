import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import ExcelJS from "exceljs";

function isAdmin(req: NextRequest) {
  return (
    req.headers.get("x-admin-request") === "true" ||
    req.nextUrl.searchParams.get("admin") === "true"
  );
}

// ─── Warna tema ───────────────────────────────────────────────────────────────
const DARK_BG    = "FF0A0A0A";
const ACCENT     = "FF6366F1"; // indigo
const ACCENT2    = "FF8B5CF6"; // purple
const WHITE      = "FFFFFFFF";
const LIGHT_GRAY = "FFF1F5F9";
const MID_GRAY   = "FFE2E8F0";
const TEXT_DARK  = "FF1E293B";
const GREEN_BG   = "FFD1FAE5";
const GREEN_TEXT = "FF065F46";
const RED_BG     = "FFFEE2E2";
const RED_TEXT   = "FF991B1B";
const YELLOW_BG  = "FFFEF3C7";
const YELLOW_TEXT= "FF92400E";

function headerStyle(wb: ExcelJS.Workbook, bgColor: string, textColor = WHITE, bold = true) {
  return {
    font: { name: "Arial", bold, color: { argb: textColor }, size: 11 },
    fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: bgColor } },
    alignment: { horizontal: "center" as const, vertical: "middle" as const, wrapText: true },
    border: {
      top:    { style: "thin" as const, color: { argb: "FFD1D5DB" } },
      bottom: { style: "thin" as const, color: { argb: "FFD1D5DB" } },
      left:   { style: "thin" as const, color: { argb: "FFD1D5DB" } },
      right:  { style: "thin" as const, color: { argb: "FFD1D5DB" } },
    },
  };
}

function cellStyle(bold = false, align: "left"|"center"|"right" = "left", bgColor = WHITE, textColor = TEXT_DARK) {
  return {
    font: { name: "Arial", bold, color: { argb: textColor }, size: 10 },
    fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: bgColor } },
    alignment: { horizontal: align, vertical: "middle" as const },
    border: {
      top:    { style: "thin" as const, color: { argb: "FFE5E7EB" } },
      bottom: { style: "thin" as const, color: { argb: "FFE5E7EB" } },
      left:   { style: "thin" as const, color: { argb: "FFE5E7EB" } },
      right:  { style: "thin" as const, color: { argb: "FFE5E7EB" } },
    },
  };
}

function formatRupiah(num: number) {
  return `Rp ${num.toLocaleString("id-ID")}`;
}

// ─── Sheet 1: Ringkasan ───────────────────────────────────────────────────────
async function buildRingkasan(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet("📊 Ringkasan");
  ws.properties.defaultRowHeight = 22;

  // Ambil data dari DB
  const [ordersAll]  = await db.query<any[]>("SELECT * FROM orders ORDER BY created_at DESC");
  const [products]   = await db.query<any[]>("SELECT * FROM products WHERE is_active = 1");
  const [keuangan]   = await db.query<any[]>("SELECT * FROM keuangan ORDER BY created_at DESC");
  const [modalRow]   = await db.query<any[]>("SELECT total_modal FROM finance_settings WHERE id = 1");
  const [promoCount] = await db.query<any[]>("SELECT COUNT(*) as cnt FROM promotions WHERE is_active = 1");
  const [testiCount] = await db.query<any[]>("SELECT COUNT(*) as cnt FROM testimonials WHERE status = 'approved'");

  const totalModal     = (modalRow as any[])[0]?.total_modal ?? 0;
  const totalIncome    = (keuangan as any[]).filter((k: any) => k.type === "income").reduce((s: number, k: any) => s + Number(k.amount), 0);
  const totalExpense   = (keuangan as any[]).filter((k: any) => k.type === "expense").reduce((s: number, k: any) => s + Number(k.amount), 0);
  const totalOrders    = (ordersAll as any[]).length;
  const selesai        = (ordersAll as any[]).filter((o: any) => o.status === "selesai").length;
  const pending        = (ordersAll as any[]).filter((o: any) => o.status === "pending").length;
  const dibatalkan     = (ordersAll as any[]).filter((o: any) => o.status === "dibatalkan").length;
  const totalProduk    = (products as any[]).length;
  const stokHabis      = (products as any[]).filter((p: any) => p.stock === 0).length;
  const laba           = totalIncome - totalExpense;
  const activePromo    = (promoCount as any[])[0]?.cnt ?? 0;
  const approvedTesti  = (testiCount as any[])[0]?.cnt ?? 0;

  // ── Title banner ──
  ws.mergeCells("A1:F1");
  const titleCell = ws.getCell("A1");
  titleCell.value = "LAPORAN BISNIS — MARKAS iPHONE";
  titleCell.style = {
    font: { name: "Arial", bold: true, size: 16, color: { argb: WHITE } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT } },
    alignment: { horizontal: "center", vertical: "middle" },
  };
  ws.getRow(1).height = 40;

  ws.mergeCells("A2:F2");
  const subCell = ws.getCell("A2");
  subCell.value = `Digenerate otomatis pada: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}  |  Data real-time dari database`;
  subCell.style = {
    font: { name: "Arial", italic: true, size: 9, color: { argb: "FF94A3B8" } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E1B4B" } },
    alignment: { horizontal: "center", vertical: "middle" },
  };
  ws.getRow(2).height = 18;

  ws.addRow([]);
  ws.getRow(3).height = 8;

  // ── Seksi KPI ──
  const kpiData = [
    ["💰 Total Pendapatan",  totalIncome,  "currency", "income"],
    ["💸 Total Pengeluaran", totalExpense, "currency", "expense"],
    ["📈 Laba Bersih",       laba,         "currency", laba >= 0 ? "income" : "expense"],
    ["🏦 Modal Toko",        totalModal,   "currency", "neutral"],
  ];

  // Section header Keuangan
  ws.mergeCells("A4:F4");
  const secKeu = ws.getCell("A4");
  secKeu.value = "💼  RINGKASAN KEUANGAN";
  secKeu.style = headerStyle(wb, ACCENT2);
  ws.getRow(4).height = 26;

  // KPI row header
  const kpiHeaders = ["Indikator", "Nilai", "", "Indikator", "Nilai", ""];
  const hRow = ws.addRow(kpiHeaders);
  hRow.height = 22;
  [1,2,4,5].forEach(c => {
    hRow.getCell(c).style = headerStyle(wb, "FF334155", WHITE);
  });
  [3,6].forEach(c => {
    hRow.getCell(c).style = { fill: { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } } };
  });

  const orderKPIs = [
    ["📦 Total Order",        totalOrders,  "number", "neutral"],
    ["✅ Order Selesai",       selesai,      "number", "income"],
    ["⏳ Order Pending",       pending,      "number", "neutral"],
    ["❌ Order Dibatalkan",    dibatalkan,   "number", "expense"],
  ];

  const maxKPI = Math.max(kpiData.length, orderKPIs.length);
  for (let i = 0; i < maxKPI; i++) {
    const left  = kpiData[i];
    const right = orderKPIs[i];
    const r = ws.addRow([
      left  ? left[0]  : "",
      left  ? left[1]  : "",
      "",
      right ? right[0] : "",
      right ? right[1] : "",
      "",
    ]);
    r.height = 24;

    const applyKPI = (labelCol: number, valCol: number, item: any[]) => {
      if (!item) return;
      const [, val, type, trend] = item;
      r.getCell(labelCol).style = cellStyle(true, "left", LIGHT_GRAY, TEXT_DARK);
      const vc = r.getCell(valCol);
      let bgC = WHITE, txC = TEXT_DARK;
      if (trend === "income")  { bgC = GREEN_BG;  txC = GREEN_TEXT; }
      if (trend === "expense") { bgC = RED_BG;    txC = RED_TEXT; }
      if (trend === "neutral") { bgC = YELLOW_BG; txC = YELLOW_TEXT; }
      vc.style = { ...cellStyle(true, "right", bgC, txC) };
      if (type === "currency") {
        vc.value = Number(val);
        vc.numFmt = '"Rp "#,##0';
      } else {
        vc.value = Number(val);
        vc.numFmt = "#,##0";
      }
    };
    applyKPI(1, 2, left);
    applyKPI(4, 5, right);
    r.getCell(3).style = { fill: { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } } };
    r.getCell(6).style = { fill: { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } } };
  }

  ws.addRow([]);
  ws.getRow(ws.rowCount).height = 10;

  // ── Seksi Produk & Lainnya ──
  ws.mergeCells(`A${ws.rowCount + 1}:F${ws.rowCount + 1}`);
  const secProd = ws.getCell(`A${ws.rowCount}`);
  secProd.value = "🛍️  RINGKASAN PRODUK & LAINNYA";
  secProd.style = headerStyle(wb, "FF0F172A");
  ws.getRow(ws.rowCount).height = 26;

  const prodKPIs = [
    ["🛒 Total Produk Aktif",     totalProduk,   "number"],
    ["⚠️ Produk Stok Habis",      stokHabis,     "number"],
    ["🏷️ Promo Aktif",            activePromo,   "number"],
    ["⭐ Testimoni Disetujui",    approvedTesti, "number"],
  ];

  const phRow = ws.addRow(["Indikator", "Nilai", "", "", "", ""]);
  ws.mergeCells(`A${phRow.number}:B${phRow.number}`);
  phRow.height = 22;
  [1,2].forEach(c => phRow.getCell(c).style = headerStyle(wb, "FF334155", WHITE));

  prodKPIs.forEach((item, idx) => {
    const r = ws.addRow([item[0], "", "", "", "", ""]);
    r.height = 22;
    r.getCell(1).value = item[0];
    r.getCell(1).style = cellStyle(false, "left", LIGHT_GRAY, TEXT_DARK);
    r.getCell(2).value = Number(item[1]);
    r.getCell(2).numFmt = "#,##0";
    r.getCell(2).style = cellStyle(true, "right", idx % 2 === 0 ? "FFF8FAFC" : WHITE, TEXT_DARK);
  });

  // ── Breakdown order per status (tabel kecil) ──
  ws.addRow([]);

  const statusList = ["pending","diproses","dikirim","selesai","dibatalkan"];
  const statusEmoji: Record<string,string> = {
    pending: "⏳", diproses: "🔄", dikirim: "🚚", selesai: "✅", dibatalkan: "❌"
  };
  ws.mergeCells(`D${ws.rowCount + 1}:F${ws.rowCount + 1}`);
  const brkRow = ws.addRow(["", "", "", "STATUS ORDER", "JUMLAH", "%"]);
  brkRow.height = 22;
  [4,5,6].forEach(c => brkRow.getCell(c).style = headerStyle(wb, ACCENT));

  statusList.forEach((st, i) => {
    const cnt = (ordersAll as any[]).filter((o: any) => o.status === st).length;
    const r = ws.addRow(["","","", `${statusEmoji[st]} ${st}`, cnt, ""]);
    r.height = 20;
    r.getCell(4).style = cellStyle(false, "left", i % 2 === 0 ? LIGHT_GRAY : WHITE);
    r.getCell(5).style = cellStyle(true, "center", i % 2 === 0 ? LIGHT_GRAY : WHITE);
    r.getCell(5).value = cnt;
    r.getCell(5).numFmt = "#,##0";
    // formula % dari total (avoid DIV0)
    r.getCell(6).value = totalOrders > 0 ? cnt / totalOrders : 0;
    r.getCell(6).numFmt = "0.0%";
    r.getCell(6).style = cellStyle(false, "center", i % 2 === 0 ? LIGHT_GRAY : WHITE);
  });

  // ── Column widths ──
  ws.columns = [
    { width: 32 },
    { width: 20 },
    { width: 3  },
    { width: 32 },
    { width: 18 },
    { width: 10 },
  ];
}

// ─── Sheet 2: Data Orders ─────────────────────────────────────────────────────
async function buildOrders(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet("📦 Data Orders");
  ws.properties.defaultRowHeight = 20;

  const [orders] = await db.query<any[]>(
    "SELECT * FROM orders ORDER BY created_at DESC"
  );

  // Title
  ws.mergeCells("A1:I1");
  const t = ws.getCell("A1");
  t.value = "DATA ORDERS — MARKAS iPHONE";
  t.style = { font: { name: "Arial", bold: true, size: 14, color: { argb: WHITE } }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT } }, alignment: { horizontal: "center", vertical: "middle" } };
  ws.getRow(1).height = 36;

  ws.addRow([]);
  ws.getRow(2).height = 8;

  const headers = ["#", "ID Order", "Nama Customer", "Email", "Telepon", "Produk", "Total Harga", "Status", "Tanggal"];
  const hRow = ws.addRow(headers);
  hRow.height = 26;
  hRow.eachCell(cell => {
    cell.style = headerStyle(wb, "FF1E293B");
  });

  const statusColor: Record<string, { bg: string; tx: string }> = {
    pending:    { bg: YELLOW_BG,  tx: YELLOW_TEXT },
    diproses:   { bg: "FFDBEAFE", tx: "FF1E40AF" },
    dikirim:    { bg: "FFE0E7FF", tx: "FF3730A3" },
    selesai:    { bg: GREEN_BG,   tx: GREEN_TEXT },
    dibatalkan: { bg: RED_BG,     tx: RED_TEXT },
  };

  (orders as any[]).forEach((o: any, i: number) => {
    // Parse total_price — bisa string "Rp 12.000.000" atau angka
    let totalNum = 0;
    if (typeof o.total_price === "number") {
      totalNum = o.total_price;
    } else {
      totalNum = parseInt(String(o.total_price).replace(/\D/g, ""), 10) || 0;
    }

    const isEven = i % 2 === 0;
    const rowBg = isEven ? LIGHT_GRAY : WHITE;
    const sc = statusColor[o.status] ?? { bg: WHITE, tx: TEXT_DARK };

    const r = ws.addRow([
      i + 1,
      o.id,
      o.customer_name,
      o.customer_email ?? "-",
      o.phone,
      o.product,
      totalNum,
      o.status,
      new Date(o.created_at),
    ]);
    r.height = 22;
    r.eachCell((cell, colNum) => {
      cell.style = cellStyle(false, "left", rowBg);
      if (colNum === 1) { cell.style = cellStyle(false, "center", rowBg); }
      if (colNum === 2) { cell.style = cellStyle(false, "center", rowBg); }
      if (colNum === 7) {
        cell.numFmt = '"Rp "#,##0';
        cell.style = cellStyle(true, "right", rowBg, GREEN_TEXT);
      }
      if (colNum === 8) {
        cell.style = { ...cellStyle(true, "center", sc.bg, sc.tx) };
      }
      if (colNum === 9) {
        cell.numFmt = "DD/MM/YYYY HH:MM";
        cell.style = cellStyle(false, "center", rowBg);
      }
    });
  });

  // Total row
  const totalRow = ws.addRow(["", "", "", "", "", "TOTAL", `=SUM(G4:G${ws.rowCount})`, "", ""]);
  totalRow.height = 26;
  totalRow.getCell(6).style = headerStyle(wb, "FF334155");
  totalRow.getCell(7).numFmt = '"Rp "#,##0';
  totalRow.getCell(7).style = headerStyle(wb, ACCENT);

  ws.columns = [
    { width: 5  },
    { width: 8  },
    { width: 26 },
    { width: 28 },
    { width: 16 },
    { width: 35 },
    { width: 18 },
    { width: 14 },
    { width: 20 },
  ];

  // Freeze header
  ws.views = [{ state: "frozen", xSplit: 0, ySplit: 3 }];

  // Auto filter
  ws.autoFilter = { from: "A3", to: "I3" };
}

// ─── Sheet 3: Keuangan ────────────────────────────────────────────────────────
async function buildKeuangan(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet("💰 Keuangan");
  ws.properties.defaultRowHeight = 20;

  const [keuangan]   = await db.query<any[]>("SELECT * FROM keuangan ORDER BY created_at DESC");
  const [modalRow]   = await db.query<any[]>("SELECT total_modal FROM finance_settings WHERE id = 1");
  const totalModal   = (modalRow as any[])[0]?.total_modal ?? 0;

  const incomes  = (keuangan as any[]).filter((k: any) => k.type === "income");
  const expenses = (keuangan as any[]).filter((k: any) => k.type === "expense");

  ws.mergeCells("A1:E1");
  const t = ws.getCell("A1");
  t.value = "LAPORAN KEUANGAN — MARKAS iPHONE";
  t.style = { font: { name: "Arial", bold: true, size: 14, color: { argb: WHITE } }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } }, alignment: { horizontal: "center", vertical: "middle" } };
  ws.getRow(1).height = 36;

  ws.addRow([]);
  ws.getRow(2).height = 8;

  // ── Summary KPI ──
  ws.mergeCells("A3:E3");
  ws.getCell("A3").value = "📊 RINGKASAN KEUANGAN";
  ws.getCell("A3").style = headerStyle(wb, "FF065F46");
  ws.getRow(3).height = 24;

  const summaryData = [
    ["🏦 Modal Toko", totalModal],
    ["💰 Total Pemasukan", incomes.reduce((s: number, k: any) => s + Number(k.amount), 0)],
    ["💸 Total Pengeluaran", expenses.reduce((s: number, k: any) => s + Number(k.amount), 0)],
  ];

  summaryData.forEach(([label, val], i) => {
    const r = ws.addRow([label, val, "", "", ""]);
    r.height = 22;
    r.getCell(1).style = cellStyle(false, "left", i % 2 === 0 ? GREEN_BG : "FFF0FDF4", GREEN_TEXT);
    r.getCell(2).style = cellStyle(true, "right", i % 2 === 0 ? GREEN_BG : "FFF0FDF4", GREEN_TEXT);
    r.getCell(2).numFmt = '"Rp "#,##0';
    r.getCell(2).value = Number(val);
  });

  // Laba row (formula)
  const labaRow = ws.addRow(["📈 Laba Bersih (Pemasukan - Pengeluaran)", `=B5-B6`, "", "", ""]);
  labaRow.height = 24;
  labaRow.getCell(1).style = headerStyle(wb, ACCENT);
  labaRow.getCell(2).style = headerStyle(wb, ACCENT);
  labaRow.getCell(2).numFmt = '"Rp "#,##0';

  ws.addRow([]);
  ws.getRow(ws.rowCount).height = 10;

  // ── Tabel Pemasukan ──
  ws.mergeCells(`A${ws.rowCount + 1}:E${ws.rowCount + 1}`);
  ws.getCell(`A${ws.rowCount}`).value = "✅ DAFTAR PEMASUKAN";
  ws.getCell(`A${ws.rowCount}`).style = headerStyle(wb, "FF16A34A");
  ws.getRow(ws.rowCount).height = 24;

  const incHRow = ws.addRow(["#", "Keterangan", "Jumlah", "Tanggal", ""]);
  incHRow.height = 22;
  incHRow.eachCell(cell => cell.style = headerStyle(wb, "FF166534", WHITE));

  incomes.forEach((k: any, i: number) => {
    const r = ws.addRow([i + 1, k.description, Number(k.amount), new Date(k.created_at), ""]);
    r.height = 20;
    const bg = i % 2 === 0 ? "FFF0FDF4" : WHITE;
    r.getCell(1).style = cellStyle(false, "center", bg);
    r.getCell(2).style = cellStyle(false, "left", bg);
    r.getCell(3).style = cellStyle(false, "right", bg, GREEN_TEXT);
    r.getCell(3).numFmt = '"Rp "#,##0';
    r.getCell(4).style = cellStyle(false, "center", bg);
    r.getCell(4).numFmt = "DD/MM/YYYY";
  });

  const incTotalRow = ws.addRow(["", "TOTAL PEMASUKAN", `=SUM(C${ws.rowCount - incomes.length + 1}:C${ws.rowCount})`, "", ""]);
  incTotalRow.height = 24;
  incTotalRow.getCell(2).style = headerStyle(wb, "FF166534");
  incTotalRow.getCell(3).style = headerStyle(wb, "FF16A34A");
  incTotalRow.getCell(3).numFmt = '"Rp "#,##0';

  ws.addRow([]);
  ws.getRow(ws.rowCount).height = 10;

  // ── Tabel Pengeluaran ──
  ws.mergeCells(`A${ws.rowCount + 1}:E${ws.rowCount + 1}`);
  ws.getCell(`A${ws.rowCount}`).value = "❌ DAFTAR PENGELUARAN";
  ws.getCell(`A${ws.rowCount}`).style = headerStyle(wb, "FFDC2626");
  ws.getRow(ws.rowCount).height = 24;

  const expHRow = ws.addRow(["#", "Keterangan", "Jumlah", "Tanggal", ""]);
  expHRow.height = 22;
  expHRow.eachCell(cell => cell.style = headerStyle(wb, "FF991B1B", WHITE));

  expenses.forEach((k: any, i: number) => {
    const r = ws.addRow([i + 1, k.description, Number(k.amount), new Date(k.created_at), ""]);
    r.height = 20;
    const bg = i % 2 === 0 ? "FFFEF2F2" : WHITE;
    r.getCell(1).style = cellStyle(false, "center", bg);
    r.getCell(2).style = cellStyle(false, "left", bg);
    r.getCell(3).style = cellStyle(false, "right", bg, RED_TEXT);
    r.getCell(3).numFmt = '"Rp "#,##0';
    r.getCell(4).style = cellStyle(false, "center", bg);
    r.getCell(4).numFmt = "DD/MM/YYYY";
  });

  const expTotalRow = ws.addRow(["", "TOTAL PENGELUARAN", `=SUM(C${ws.rowCount - expenses.length + 1}:C${ws.rowCount})`, "", ""]);
  expTotalRow.height = 24;
  expTotalRow.getCell(2).style = headerStyle(wb, "FF991B1B");
  expTotalRow.getCell(3).style = headerStyle(wb, "FFDC2626");
  expTotalRow.getCell(3).numFmt = '"Rp "#,##0';

  ws.columns = [
    { width: 5  },
    { width: 40 },
    { width: 20 },
    { width: 18 },
    { width: 5  },
  ];

  ws.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];
}

// ─── Sheet 4: Produk ──────────────────────────────────────────────────────────
async function buildProduk(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet("🛍️ Produk");
  ws.properties.defaultRowHeight = 20;

  const [products] = await db.query<any[]>(
    `SELECT p.*, 
      COALESCE(pr.discount_percent, 0) AS discount_percent,
      COALESCE(pr.is_active, 0) AS has_promo
     FROM products p
     LEFT JOIN promotions pr ON pr.product_id = p.id AND pr.is_active = 1
     ORDER BY p.category, p.name`
  );

  ws.mergeCells("A1:H1");
  const t = ws.getCell("A1");
  t.value = "DATA PRODUK — MARKAS iPHONE";
  t.style = { font: { name: "Arial", bold: true, size: 14, color: { argb: WHITE } }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF7C3AED" } }, alignment: { horizontal: "center", vertical: "middle" } };
  ws.getRow(1).height = 36;

  ws.addRow([]);
  ws.getRow(2).height = 8;

  const headers = ["#", "Nama Produk", "Kategori", "Harga Dasar", "Diskon", "Harga Setelah Diskon", "Stok", "Status"];
  const hRow = ws.addRow(headers);
  hRow.height = 26;
  hRow.eachCell(cell => cell.style = headerStyle(wb, "FF4C1D95"));

  (products as any[]).forEach((p: any, i: number) => {
    const isEven = i % 2 === 0;
    const bg = isEven ? "FFF5F3FF" : WHITE;
    const stok = Number(p.stock);
    const diskon = Number(p.discount_percent);
    const hargaDasar = Number(p.base_price);
    const hargaDiskon = diskon > 0 ? hargaDasar * (1 - diskon / 100) : hargaDasar;

    const r = ws.addRow([
      i + 1,
      p.name,
      p.category,
      hargaDasar,
      diskon > 0 ? diskon / 100 : 0,
      hargaDiskon,
      stok,
      p.is_active ? "Aktif" : "Nonaktif",
    ]);
    r.height = 22;

    r.getCell(1).style = cellStyle(false, "center", bg);
    r.getCell(2).style = cellStyle(true, "left", bg, "FF5B21B6");
    r.getCell(3).style = cellStyle(false, "center", bg);
    r.getCell(4).style = cellStyle(false, "right", bg);
    r.getCell(4).numFmt = '"Rp "#,##0';
    r.getCell(5).style = cellStyle(false, "center", diskon > 0 ? YELLOW_BG : bg, diskon > 0 ? YELLOW_TEXT : TEXT_DARK);
    r.getCell(5).numFmt = diskon > 0 ? "0%" : '"-"';
    r.getCell(6).style = cellStyle(true, "right", diskon > 0 ? GREEN_BG : bg, diskon > 0 ? GREEN_TEXT : TEXT_DARK);
    r.getCell(6).numFmt = '"Rp "#,##0';
    r.getCell(7).style = cellStyle(true, "center", stok === 0 ? RED_BG : stok < 5 ? YELLOW_BG : bg, stok === 0 ? RED_TEXT : stok < 5 ? YELLOW_TEXT : TEXT_DARK);
    r.getCell(8).style = cellStyle(false, "center", p.is_active ? GREEN_BG : RED_BG, p.is_active ? GREEN_TEXT : RED_TEXT);
  });

  // Summary baris bawah
  const sumRow = ws.addRow(["", "", `TOTAL: ${(products as any[]).length} produk`, "", "", "", `=SUM(G4:G${ws.rowCount})`, ""]);
  sumRow.height = 26;
  sumRow.getCell(3).style = headerStyle(wb, "FF4C1D95");
  sumRow.getCell(7).style = headerStyle(wb, "FF7C3AED");
  sumRow.getCell(7).numFmt = "#,##0";

  ws.columns = [
    { width: 5  },
    { width: 36 },
    { width: 14 },
    { width: 18 },
    { width: 10 },
    { width: 22 },
    { width: 8  },
    { width: 12 },
  ];

  ws.views = [{ state: "frozen", xSplit: 0, ySplit: 3 }];
  ws.autoFilter = { from: "A3", to: "H3" };
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const wb = new ExcelJS.Workbook();
    wb.creator = "Markas iPhone";
    wb.created = new Date();
    wb.modified = new Date();

    // Build semua sheet secara paralel untuk speed
    await buildRingkasan(wb);
    await buildOrders(wb);
    await buildKeuangan(wb);
    await buildProduk(wb);

    const buffer = await wb.xlsx.writeBuffer();
    const now = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Laporan_MarkasiPhone_${now}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Export Excel error:", err);
    return NextResponse.json({ error: "Gagal generate Excel" }, { status: 500 });
  }
}