"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Copy,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  XCircle,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Navbar from "../../components/Navbar";

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error";
type Toast = { id: number; message: string; type: ToastType };

let _toastCounter = 0;

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-bold text-white shadow-2xl backdrop-blur-xl ${
              t.type === "success" ? "bg-emerald-500/90" : "bg-red-500/90"
            }`}
          >
            {t.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <XCircle size={18} />
            )}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Fallback saat checkout content masih di-load (dipakai Suspense) ─────────

function CheckoutSkeleton() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-32">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="h-[600px] animate-pulse rounded-[42px] border border-white/10 bg-white/5" />
          <div className="h-[600px] animate-pulse rounded-[42px] border border-white/10 bg-white/5" />
        </div>
      </section>
    </main>
  );
}

// ─── Konten checkout — komponen inilah yang memakai useSearchParams() ────────

function CheckoutContent() {
  const searchParams = useSearchParams();

  const produk = searchParams.get("produk") || "Produk Apple";
  const harga = searchParams.get("harga") || "Rp 0";

  const rekening = "1234567890";
  const [loading, setLoading] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    phone: "",
    address: "",
  });

  // ─── Toast helpers ────────────────────────────────────────────────────────

  function showToast(message: string, type: ToastType = "success") {
    _toastCounter += 1;
    const id = _toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3500
    );
  }

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const copyRekening = async () => {
    try {
      await navigator.clipboard.writeText(rekening);
      showToast("Nomor rekening berhasil disalin", "success");
    } catch {
      showToast("Gagal menyalin rekening", "error");
    }
  };

  const handleOrder = async () => {
    if (
      !form.customer_name ||
      !form.customer_email ||
      !form.phone ||
      !form.address
    ) {
      showToast("Lengkapi semua data checkout", "error");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          phone: form.phone,
          address: form.address,
          product: produk,
          total_price: harga,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "Gagal membuat order", "error");
        return;
      }

      showToast("Pesanan berhasil dibuat! Mengalihkan ke WhatsApp...", "success");

      const waText = encodeURIComponent(`Halo Admin Markas iPhone,

Saya sudah membuat pesanan.

Nama: ${form.customer_name}
Email: ${form.customer_email}
No WA: ${form.phone}

Produk: ${produk}
Total: ${harga}

Saya akan mengirim bukti transfer di chat ini.`);

      // Beri jeda sebentar agar toast sempat terbaca sebelum redirect
      setTimeout(() => {
        window.location.href = `https://wa.me/6281386824603?text=${waText}`;
      }, 1200);
    } catch (error) {
      console.error(error);
      showToast("Terjadi kesalahan pada server", "error");
    } finally {
      setLoading(false);
    }
  };

  // ─── Styles ───────────────────────────────────────────────────────────────

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-black/40 py-4 pl-12 pr-4 font-bold text-white outline-none placeholder:text-white/35 shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.25)] transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500";

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <ToastContainer toasts={toasts} />
      <Navbar />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#2563eb55_0%,transparent_35%),radial-gradient(circle_at_bottom_right,#9333ea55_0%,transparent_35%)]" />

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-32">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* ── Kolom kiri: form ── */}
          <motion.div
            initial={{ opacity: 0, x: -35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="overflow-hidden rounded-[42px] border border-white/10 bg-white/10 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-white/80">
              <Sparkles size={15} />
              Secure Checkout
            </div>

            <h1 className="mb-3 text-6xl font-black tracking-[-0.07em]">
              Checkout.
            </h1>

            <p className="mb-10 max-w-lg text-lg leading-8 text-white/55">
              Lengkapi data checkout. Invoice akan dikirim ke email customer.
            </p>

            {/* Ringkasan produk */}
            <div className="rounded-[34px] border border-white/10 bg-black/30 p-7">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white/40">
                    Produk Dipilih
                  </p>
                  <h2 className="mt-2 text-3xl font-black">{produk}</h2>
                </div>

                <div className="rounded-2xl bg-blue-500/20 px-4 py-2 text-sm font-black text-blue-300">
                  Apple
                </div>
              </div>

              <div className="mb-6 h-px bg-white/10" />

              <div className="flex items-center justify-between">
                <p className="text-white/50">Total Pembayaran</p>
                <h3 className="text-4xl font-black tracking-[-0.05em]">
                  {harga}
                </h3>
              </div>
            </div>

            {/* Form input */}
            <div className="mt-8 space-y-4">
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300"
                  size={18}
                />
                <input
                  placeholder="Nama lengkap"
                  value={form.customer_name}
                  onChange={(e) =>
                    setForm({ ...form, customer_name: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300"
                  size={18}
                />
                <input
                  type="email"
                  placeholder="Email customer"
                  value={form.customer_email}
                  onChange={(e) =>
                    setForm({ ...form, customer_email: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              <div className="relative">
                <Phone
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300"
                  size={18}
                />
                <input
                  placeholder="Nomor WhatsApp"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              <div className="relative">
                <MapPin
                  className="absolute left-4 top-6 text-blue-300"
                  size={18}
                />
                <textarea
                  placeholder="Alamat lengkap"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  className={`${inputClass} h-32 resize-none`}
                />
              </div>
            </div>

            {/* Info cards */}
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <ShieldCheck className="mb-4 text-blue-300" />
                <h3 className="mb-2 text-xl font-black">Pembayaran Aman</h3>
                <p className="text-sm leading-7 text-white/50">
                  Semua transaksi diverifikasi langsung oleh admin.
                </p>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <CreditCard className="mb-4 text-blue-300" />
                <h3 className="mb-2 text-xl font-black">Manual Transfer</h3>
                <p className="text-sm leading-7 text-white/50">
                  Bisa transfer via mBanking, ATM, atau QRIS.
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── Kolom kanan: pembayaran ── */}
          <motion.div
            initial={{ opacity: 0, x: 35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="overflow-hidden rounded-[42px] border border-white/10 bg-white/10 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
          >
            <p className="mb-3 text-sm font-black uppercase tracking-[0.3em] text-blue-300">
              Payment Method
            </p>

            <h2 className="mb-10 text-5xl font-black tracking-[-0.06em]">
              Transfer Bank
            </h2>

            <div className="mb-8 rounded-[34px] bg-white p-8 text-black">
              <p className="mb-2 text-sm font-bold text-neutral-400">
                Bank BCA
              </p>

              <h3 className="mb-4 text-5xl font-black tracking-[-0.05em]">
                {rekening}
              </h3>

              <p className="text-neutral-500">Atas Nama: M. Iqbal Ihza</p>

              <p className="mb-2 text-sm font-bold text-neutral-400">
                SeaBank
              </p>

              <h3 className="mb-4 text-5xl font-black tracking-[-0.05em]">
                {rekening}
              </h3>

              <p className="text-neutral-500">Atas Nama: Muhammad Iqbal</p>

              <button
                type="button"
                onClick={copyRekening}
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-black text-white transition hover:bg-blue-600"
              >
                <Copy size={16} />
                Copy Rekening
              </button>
            </div>

            <button
              type="button"
              onClick={handleOrder}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 py-5 text-lg font-black text-white shadow-[0_15px_60px_rgba(37,99,235,0.45)] transition hover:scale-[1.02] disabled:opacity-50"
            >
              <CheckCircle2 size={22} />
              {loading ? "Memproses..." : "Buat Pesanan & Kirim Invoice"}
            </button>

            <p className="mt-5 text-center text-sm text-white/35">
              Order masuk database, admin dapat email, customer dapat invoice.
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

// ─── Default export — wajib dibungkus Suspense karena CheckoutContent ───────
// ─── memakai useSearchParams(), jika tidak Next.js akan gagal build (CSR bailout) ───

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutContent />
    </Suspense>
  );
}