"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  ShoppingBag,
  TrendingUp,
  Package,
  Wallet,
  ArrowLeft,
  RefreshCw,
  BarChart2,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Star,
  Tag,
  Globe,
  ImageIcon,
} from "lucide-react";
import ExcelJs from "exceljs";

// ─── Types ────────────────────────────────────────────────────────────────────
type DashboardStats = {
  total_orders: number;
  total_omset: number;
  total_products: number;
  pending_orders: number;
};

type Order = {
  id: number;
  product: string;
  total_price: string;
  status: string;
  created_at: string;
};

type KeuanganEntry = {
  id: number;
  type: "income" | "expense";
  amount: number;
  description: string;
  created_at: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function getLast7Months() {
  const result = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({ year: d.getFullYear(), month: d.getMonth(), label: MONTHS_ID[d.getMonth()] });
  }
  return result;
}

function parsePrice(raw: string): number {
  return parseInt(raw.replace(/\D/g, ""), 10) || 0;
}

function formatRp(val: number): string {
  if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(1)}M`;
  if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)}jt`;
  if (val >= 1_000) return `Rp ${(val / 1_000).toFixed(0)}rb`;
  return `Rp ${val}`;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, isCurrency = true }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  isCurrency?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111]/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
      {label && <p className="mb-2 text-xs font-bold text-white/40">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/60">{p.name}:</span>
          <span className="font-bold text-white">
            {isCurrency ? formatRp(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  Icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition hover:border-white/20">
      <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}>
        <Icon size={20} className="text-white" />
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-white/35">{label}</p>
      <p className="mt-1 text-3xl font-black tracking-tight text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-white/35">{sub}</p>}
    </div>
  );
}

// ─── Chart Card wrapper ───────────────────────────────────────────────────────
function ChartCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <div className="mb-5">
        <p className="text-base font-black text-white">{title}</p>
        {sub && <p className="mt-0.5 text-xs text-white/35">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Status color map ─────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  diproses: "#3b82f6",
  dikirim: "#8b5cf6",
  selesai: "#10b981",
  dibatalkan: "#ef4444",
};

const DONUT_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [keuangan, setKeuangan] = useState<KeuanganEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Auth check
  useEffect(() => {
    const isLogged = localStorage.getItem("markas_admin_logged_in");
    if (!isLogged) window.location.href = "/rahasia-admin-markas/login";
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, keuanganRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/orders"),
        fetch("/api/keuangan"),
      ]);
      const [statsData, ordersData, keuanganData] = await Promise.all([
        statsRes.json(),
        ordersRes.json(),
        keuanganRes.json(),
      ]);

      setStats(statsData);
      setOrders(Array.isArray(ordersData) ? ordersData : ordersData.orders ?? []);
      setKeuangan(Array.isArray(keuanganData) ? keuanganData : keuanganData.data ?? []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Gagal fetch data dashboard:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Chart data derivations ──────────────────────────────────────────────────

  // 1. Omset & jumlah order per bulan (7 bulan terakhir)
  const monthlyData = (() => {
    const months = getLast7Months();
    return months.map(({ year, month, label }) => {
      const monthOrders = orders.filter((o) => {
        const d = new Date(o.created_at);
        return d.getFullYear() === year && d.getMonth() === month;
      });
      const omset = monthOrders.reduce((sum, o) => sum + parsePrice(o.total_price), 0);
      return { label, omset, jumlah: monthOrders.length };
    });
  })();

  // 2. Order per status
  const statusData = (() => {
    const STATUS_LIST = ["pending", "diproses", "dikirim", "selesai", "dibatalkan"];
    return STATUS_LIST.map((s) => ({
      status: s.charAt(0).toUpperCase() + s.slice(1),
      jumlah: orders.filter((o) => o.status === s).length,
      fill: STATUS_COLORS[s],
    }));
  })();

  // 3. Income vs Expense per bulan (7 bulan terakhir)
  const incomeExpenseData = (() => {
    const months = getLast7Months();
    return months.map(({ year, month, label }) => {
      const monthEntries = keuangan.filter((k) => {
        const d = new Date(k.created_at);
        return d.getFullYear() === year && d.getMonth() === month;
      });
      const income = monthEntries.filter((k) => k.type === "income").reduce((s, k) => s + Number(k.amount), 0);
      const expense = monthEntries.filter((k) => k.type === "expense").reduce((s, k) => s + Number(k.amount), 0);
      return { label, income, expense };
    });
  })();

  // 4. Distribusi produk dari orders (parse product field)
  const productDistData = (() => {
    const freq: Record<string, number> = {};
    orders.forEach((o) => {
      // product field bisa berupa string nama produk atau JSON
      let productName = o.product;
      try {
        const parsed = JSON.parse(o.product);
        productName = parsed?.name ?? parsed?.[0]?.name ?? o.product;
      } catch {
        // plain string, fine
      }
      // Ambil kata pertama untuk kategori singkat
      const key = productName.split(" ").slice(0, 2).join(" ");
      freq[key] = (freq[key] || 0) + 1;
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  })();

  // ── Top metrics ─────────────────────────────────────────────────────────────
  const totalOmset = stats?.total_omset ?? orders.reduce((s, o) => s + parsePrice(o.total_price), 0);
  const selesaiCount = orders.filter((o) => o.status === "selesai").length;
  const conversionRate = orders.length > 0 ? ((selesaiCount / orders.length) * 100).toFixed(1) : "0";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4 text-white/30">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-blue-400" />
          <p className="text-sm font-semibold">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* ── Header ── */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Dashboard</h1>
            <p className="text-sm text-white/40">
              {lastUpdated
                ? `Diperbarui ${lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`
                : "Markas iPhone Analytics"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchAll}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
            <Link
              href="/rahasia-admin-markas/orders"
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft size={16} />
              Menu Admin
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">

        {/* ── Stat Cards ── */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Omset"
            value={formatRp(totalOmset)}
            sub={`dari ${orders.length} order`}
            Icon={TrendingUp}
            accent="bg-gradient-to-br from-blue-500 to-blue-700"
          />
          <StatCard
            label="Total Order"
            value={String(orders.length)}
            sub={`${stats?.pending_orders ?? 0} pending`}
            Icon={ShoppingBag}
            accent="bg-gradient-to-br from-violet-500 to-violet-700"
          />
          <StatCard
            label="Order Selesai"
            value={String(selesaiCount)}
            sub={`Konversi ${conversionRate}%`}
            Icon={CheckCircle}
            accent="bg-gradient-to-br from-emerald-500 to-emerald-700"
          />
          <StatCard
            label="Total Produk"
            value={String(stats?.total_products ?? "–")}
            sub="aktif di toko"
            Icon={Package}
            accent="bg-gradient-to-br from-amber-500 to-orange-600"
          />
        </div>

        {/* ── Row 1: Omset Area + Status Bar ── */}
        <div className="grid gap-6 xl:grid-cols-3">
          {/* Area Chart — Omset bulanan */}
          <div className="xl:col-span-2">
            <ChartCard title="Omset per Bulan" sub="7 bulan terakhir">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradOmset" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatRp(v)}
                    width={68}
                  />
                  <Tooltip content={<ChartTooltip isCurrency={true} />} />
                  <Area
                    type="monotone"
                    dataKey="omset"
                    name="Omset"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#gradOmset)"
                    dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: "#60a5fa" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Status distribution */}
          <ChartCard title="Status Order" sub="Distribusi semua order">
            <div className="space-y-3">
              {statusData.map((s) => {
                const max = Math.max(...statusData.map((x) => x.jumlah), 1);
                const pct = (s.jumlah / max) * 100;
                return (
                  <div key={s.status}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-semibold text-white/60">{s.status}</span>
                      <span className="font-black text-white">{s.jumlah}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: s.fill }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order status icons summary */}
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { label: "Pending", count: orders.filter(o=>o.status==="pending").length, Icon: Clock, color: "text-amber-400" },
                { label: "Dikirim", count: orders.filter(o=>o.status==="dikirim").length, Icon: Truck, color: "text-violet-400" },
                { label: "Batal", count: orders.filter(o=>o.status==="dibatalkan").length, Icon: XCircle, color: "text-red-400" },
              ].map(({ label, count, Icon, color }) => (
                <div key={label} className="rounded-2xl border border-white/8 bg-white/5 p-3 text-center">
                  <Icon size={16} className={`mx-auto mb-1 ${color}`} />
                  <p className="text-lg font-black text-white">{count}</p>
                  <p className="text-[10px] text-white/35">{label}</p>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* ── Row 2: Income vs Expense Line + Product Donut ── */}
        <div className="grid gap-6 xl:grid-cols-3">
          {/* Line Chart — Income vs Expense */}
          <div className="xl:col-span-2">
            <ChartCard title="Income vs Expense" sub="Dari data keuangan 7 bulan terakhir">
              {keuangan.length === 0 ? (
                <div className="flex h-[260px] items-center justify-center text-white/25">
                  <div className="text-center">
                    <Wallet size={32} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Belum ada data keuangan</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={incomeExpenseData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                    <defs>
                      <filter id="glowIncome">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatRp(v)}
                      width={68}
                    />
                    <Tooltip content={<ChartTooltip isCurrency={true} />} />
                    <Legend
                      wrapperStyle={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", paddingTop: "12px" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="income"
                      name="Income"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expense"
                      name="Expense"
                      stroke="#ef4444"
                      strokeWidth={2.5}
                      strokeDasharray="5 3"
                      dot={{ r: 4, fill: "#ef4444", strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          {/* Donut — Produk terlaris */}
          <ChartCard title="Produk Terlaris" sub="Berdasarkan jumlah order">
            {productDistData.length === 0 ? (
              <div className="flex h-[260px] items-center justify-center text-white/25">
                <div className="text-center">
                  <BarChart2 size={32} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Belum ada data order</p>
                </div>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={productDistData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {productDistData.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const p = payload[0];
                        return (
                          <div className="rounded-2xl border border-white/10 bg-[#111]/95 px-4 py-3 text-sm shadow-2xl">
                            <p className="font-bold text-white">{p.name}</p>
                            <p className="text-white/50">{p.value} order</p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="mt-3 space-y-2">
                  {productDistData.slice(0, 4).map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
                        />
                        <span className="truncate text-white/55 max-w-[110px]">{d.name}</span>
                      </div>
                      <span className="font-bold text-white">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </ChartCard>
        </div>

        {/* ── Row 3: Order Volume Bar Chart ── */}
        <ChartCard title="Volume Order per Bulan" sub="Jumlah order masuk 7 bulan terakhir">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip isCurrency={false} />} />
              <Bar dataKey="jumlah" name="Order" fill="url(#gradBar)" radius={[8, 8, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ── Quick links ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { href: "/rahasia-admin-markas/orders", label: "Orders", Icon: ShoppingBag, color: "from-blue-500/20 to-blue-600/10 border-blue-500/20" },
            { href: "/rahasia-admin-markas/produk", label: "Produk", Icon: Package, color: "from-violet-500/20 to-violet-600/10 border-violet-500/20" },
            { href: "/rahasia-admin-markas/promosi", label: "Promosi", Icon: Tag, color: "from-rose-500/20 to-rose-600/10 border-rose-500/20" }, // Warna Baru: Rose
            { href: "/rahasia-admin-markas/keuangan", label: "Keuangan", Icon: Wallet, color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20" },
            { href: "/rahasia-admin-markas/laporan", label: "Laporan", Icon: Wallet, color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20" },
            { href: "/rahasia-admin-markas/testimoni", label: "Testimoni", Icon: Star, color: "from-amber-500/20 to-amber-600/10 border-amber-500/20" },
            { href: "", label: "Banner", Icon: ImageIcon, color: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/20" }, // Warna Baru: Cyan
            { href: "/", label: "Toko", Icon: Globe, color: "from-fuchsia-500/20 to-fuchsia-600/10 border-fuchsia-500/20" }, // Warna Baru: Fuchsia
          ].map(({ href, label, Icon, color }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-[24px] border bg-gradient-to-br px-5 py-4 font-bold text-white/70 transition hover:text-white ${color}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}