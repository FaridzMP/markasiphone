"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Download, FileSpreadsheet, TrendingUp, TrendingDown,
  Package, ShoppingCart, DollarSign, AlertCircle, RefreshCw,
} from "lucide-react";
import ExcelJs from "exceljs";

// ─── Tipe ─────────────────────────────────────────────────────────────────────
interface ReportData {
  totalOrders: number;
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  totalModal: number;
  ordersByStatus: { status: string; count: number }[];
  revenueByMonth: { month: string; revenue: number; orders: number }[];
  topProducts: { name: string; count: number; revenue: number }[];
  totalProducts: number;
  lowStockProducts: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending:    "#F59E0B",
  diproses:   "#3B82F6",
  dikirim:    "#8B5CF6",
  selesai:    "#10B981",
  dibatalkan: "#EF4444",
};

const CHART_COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B"];

function formatRupiah(num: number) {
  if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)}M`;
  if (num >= 1_000_000)     return `Rp ${(num / 1_000_000).toFixed(1)}Jt`;
  if (num >= 1_000)         return `Rp ${(num / 1_000).toFixed(0)}rb`;
  return `Rp ${num.toLocaleString("id-ID")}`;
}

// ─── Komponen KPI Card ────────────────────────────────────────────────────────
function KPICard({
  title, value, icon: Icon, trend, color,
}: {
  title: string; value: string; icon: React.ElementType; trend?: "up"|"down"|"neutral"; color: string;
}) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[20px] p-5 flex items-center gap-4 hover:bg-white/8 transition-all">
      <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/50 font-medium uppercase tracking-wider truncate">{title}</p>
        <p className="text-xl font-bold text-white mt-0.5">{value}</p>
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${
          trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-yellow-400"
        }`}>
          {trend === "up" ? <TrendingUp size={14}/> : trend === "down" ? <TrendingDown size={14}/> : <AlertCircle size={14}/>}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LaporanPage() {
  const router = useRouter();
  const [data, setData]           = useState<ReportData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const logged = localStorage.getItem("markas_admin_logged_in");
      if (!logged) router.push("/rahasia-admin-markas/login");
    }
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports?admin=true", {
        headers: { "x-admin-request": "true" },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Export Excel ──
  const handleExportExcel = async () => {
    setExporting(true);
    setExportMsg("⏳ Menyiapkan laporan...");
    try {
      const res = await fetch("/api/laporan/export?admin=true", {
        headers: { "x-admin-request": "true" },
      });
      if (!res.ok) throw new Error("Gagal export");

      const blob    = await res.blob();
      const url     = URL.createObjectURL(blob);
      const link    = document.createElement("a");
      const now     = new Date().toISOString().slice(0, 10);
      link.href     = url;
      link.download = `Laporan_MarkasiPhone_${now}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      setExportMsg("✅ Berhasil diunduh!");
    } catch (err) {
      setExportMsg("❌ Gagal export. Coba lagi.");
    } finally {
      setExporting(false);
      setTimeout(() => setExportMsg(""), 4000);
    }
  };

  // ─── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm">Memuat laporan...</p>
        </div>
      </div>
    );
  }

  const netProfitTrend = !data ? "neutral" : data.netProfit > 0 ? "up" : data.netProfit < 0 ? "down" : "neutral";

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-2xl">📊</span> Laporan Bisnis
            </h1>
            <p className="text-white/40 text-sm mt-1">
              Data real-time dari database · {new Date().toLocaleDateString("id-ID", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-[12px] text-white/70 text-sm font-medium transition-all"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            {/* Export Excel — tombol utama */}
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-[12px] text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <FileSpreadsheet size={16} />
              )}
              {exporting ? "Generating..." : "Export Excel"}
              {!exporting && <Download size={14} className="opacity-70" />}
            </button>
          </div>
        </div>

        {/* Feedback export */}
        {exportMsg && (
          <div className={`px-4 py-3 rounded-[12px] text-sm font-medium border ${
            exportMsg.startsWith("✅")
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : exportMsg.startsWith("❌")
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
          }`}>
            {exportMsg}
          </div>
        )}

        {/* ── KPI Grid ── */}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Total Order"     value={data.totalOrders.toLocaleString("id-ID")} icon={ShoppingCart} color="bg-indigo-500"  trend="neutral" />
            <KPICard title="Total Produk"    value={data.totalProducts.toLocaleString("id-ID")} icon={Package}    color="bg-purple-500"  trend="neutral" />
            <KPICard title="Total Pemasukan" value={formatRupiah(data.totalRevenue)}             icon={TrendingUp} color="bg-emerald-500" trend="up" />
            <KPICard title="Laba Bersih"     value={formatRupiah(data.netProfit)}                icon={DollarSign} color={data.netProfit >= 0 ? "bg-emerald-600" : "bg-red-600"} trend={netProfitTrend} />
          </div>
        )}

        {/* ── Charts Row ── */}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Revenue by month */}
            <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[20px] p-5">
              <h2 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                <TrendingUp size={15} className="text-indigo-400" /> Tren Pendapatan & Order per Bulan
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="month" tick={{ fill: "#ffffff60", fontSize: 11 }} />
                  <YAxis yAxisId="left"  tick={{ fill: "#ffffff60", fontSize: 10 }} tickFormatter={v => formatRupiah(v)} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "#ffffff60", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: "#1e1b4b", border: "1px solid #ffffff20", borderRadius: 12, color: "#fff", fontSize: 12 }}
                    formatter={(val, name) => [
                      name === "revenue" ? formatRupiah(Number(val ?? 0)) : Number(val ?? 0),
                      name === "revenue" ? "Pendapatan" : "Order",
                    ]}
                  />
                  <Line yAxisId="left"  type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2} dot={{ fill: "#6366F1", r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="orders"  stroke="#10B981" strokeWidth={2} dot={{ fill: "#10B981", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Status pie */}
            <div className="bg-white/5 border border-white/10 rounded-[20px] p-5">
              <h2 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                <ShoppingCart size={15} className="text-purple-400" /> Status Order
              </h2>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={data.ordersByStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%" cy="50%"
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {data.ordersByStatus.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#94A3B8"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1e1b4b", border: "1px solid #ffffff20", borderRadius: 12, color: "#fff", fontSize: 12 }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11, color: "#ffffff80" }}
                    formatter={(value) => value}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Top Products & Keuangan ── */}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Top produk */}
            <div className="bg-white/5 border border-white/10 rounded-[20px] p-5">
              <h2 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                <Package size={15} className="text-yellow-400" /> Produk Terlaris
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#ffffff60", fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#ffffff80", fontSize: 10 }} width={120} />
                  <Tooltip
                    contentStyle={{ background: "#1e1b4b", border: "1px solid #ffffff20", borderRadius: 12, color: "#fff", fontSize: 12 }}
                    formatter={(val) => [Number(val ?? 0), "Order"]}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {data.topProducts.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Ringkasan keuangan */}
            <div className="bg-white/5 border border-white/10 rounded-[20px] p-5">
              <h2 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                <DollarSign size={15} className="text-emerald-400" /> Ringkasan Keuangan
              </h2>
              <div className="space-y-3">
                {[
                  { label: "Modal Toko",      val: data.totalModal,   color: "text-blue-400",    bg: "bg-blue-500/10"    },
                  { label: "Total Pemasukan", val: data.totalRevenue, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                  { label: "Total Pengeluaran", val: data.totalExpense, color: "text-red-400",   bg: "bg-red-500/10"     },
                  { label: "Laba Bersih",     val: data.netProfit,    color: data.netProfit >= 0 ? "text-emerald-400" : "text-red-400", bg: data.netProfit >= 0 ? "bg-emerald-500/10" : "bg-red-500/10" },
                ].map((item) => (
                  <div key={item.label} className={`flex items-center justify-between px-4 py-2.5 ${item.bg} rounded-[12px]`}>
                    <span className="text-white/60 text-sm">{item.label}</span>
                    <span className={`font-bold text-sm ${item.color}`}>
                      {Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.val)}
                    </span>
                  </div>
                ))}
              </div>

              {data.lowStockProducts > 0 && (
                <div className="mt-4 flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-[12px] px-4 py-3">
                  <AlertCircle size={15} className="text-yellow-400 shrink-0" />
                  <p className="text-yellow-300 text-xs font-medium">
                    {data.lowStockProducts} produk stok hampir habis (≤ 5)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Info export ── */}
        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-[16px] p-4 flex items-start gap-3">
          <FileSpreadsheet size={18} className="text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-indigo-300 text-sm font-semibold mb-1">File Excel yang akan diunduh berisi 4 sheet:</p>
            <p className="text-white/50 text-xs leading-relaxed">
              <strong className="text-white/70">📊 Ringkasan</strong> — KPI utama & breakdown status ·{" "}
              <strong className="text-white/70">📦 Data Orders</strong> — semua order dengan filter & total otomatis ·{" "}
              <strong className="text-white/70">💰 Keuangan</strong> — rincian income/expense + laba bersih ·{" "}
              <strong className="text-white/70">🛍️ Produk</strong> — katalog lengkap dengan info diskon & stok
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}