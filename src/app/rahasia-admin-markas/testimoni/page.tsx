"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Star,
  Check,
  X,
  Trash2,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  List,
  ImageIcon,
  User,
  Mail,
  Calendar,
} from "lucide-react";

type Testimoni = {
  id: number;
  customer_name: string;
  customer_email: string;
  rating: number;
  message: string;
  photo_url: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

type FilterStatus = "pending" | "approved" | "rejected" | "all";

const STATUS_TABS: { key: FilterStatus; label: string; Icon: React.ElementType }[] = [
  { key: "pending", label: "Pending", Icon: Clock },
  { key: "approved", label: "Approved", Icon: CheckCircle },
  { key: "rejected", label: "Rejected", Icon: XCircle },
  { key: "all", label: "Semua", Icon: List },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={s <= rating ? "fill-amber-400 text-amber-400" : "fill-white/10 text-white/20"}
        />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: Testimoni["status"] }) {
  const map = {
    pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    approved: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    rejected: "bg-red-500/20 text-red-300 border-red-500/30",
  };
  const labels = { pending: "Pending", approved: "Approved", rejected: "Rejected" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${map[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function AdminTestimoniPage() {
  const [testimoniList, setTestimoniList] = useState<Testimoni[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    const isLogged = localStorage.getItem("markas_admin_logged_in");
    if (!isLogged) window.location.href = "/rahasia-admin-markas/login";
  }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = filter === "all" ? "/api/testimonials" : `/api/testimonials?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setTestimoniList(Array.isArray(data) ? data : data.testimonials ?? []);
    } catch {
      showToast("Gagal memuat data testimoni", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const handleAction = async (id: number, status: "approved" | "rejected") => {
    try {
      const res = await fetch("/api/testimonials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
      showToast(status === "approved" ? "Testimoni disetujui ✓" : "Testimoni ditolak");
      fetchData();
    } catch {
      showToast("Gagal mengubah status", "error");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/testimonials?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("Testimoni dihapus");
      setConfirmDelete(null);
      fetchData();
    } catch {
      showToast("Gagal menghapus", "error");
    }
  };

  const counts = {
    pending: testimoniList.filter((t) => t.status === "pending").length,
    total: testimoniList.length,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-6 top-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3.5 text-sm font-semibold shadow-2xl backdrop-blur-xl transition-all ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-300"
              : "border-red-500/30 bg-red-500/20 text-red-300"
          }`}
        >
          {toast.type === "success" ? <Check size={16} /> : <X size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-[28px] border border-white/10 bg-[#111] p-7 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/20">
              <Trash2 size={22} className="text-red-400" />
            </div>
            <h3 className="mb-2 text-lg font-black">Hapus Testimoni?</h3>
            <p className="mb-6 text-sm text-white/50">Aksi ini tidak bisa dibatalkan.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-bold transition hover:bg-white/10"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 rounded-2xl bg-red-500/80 py-3 text-sm font-bold text-white transition hover:bg-red-500"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox */}
      {expandedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setExpandedPhoto(null)}
        >
          <img
            src={expandedPhoto}
            alt="Foto testimoni"
            className="max-h-[80vh] max-w-[90vw] rounded-3xl object-contain shadow-2xl"
          />
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Testimoni</h1>
            <p className="text-sm text-white/40">Kelola ulasan dari pelanggan</p>
          </div>
          <Link
            href="/rahasia-admin-markas/dashboard"
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Filter Tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
          {STATUS_TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition-all ${
                filter === key
                  ? "border-blue-500/50 bg-blue-500/20 text-blue-300"
                  : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white"
              }`}
            >
              <Icon size={15} />
              {label}
              {key === "pending" && counts.pending > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
                  {counts.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-white/30">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-blue-400" />
            <p className="text-sm font-semibold">Memuat testimoni...</p>
          </div>
        ) : testimoniList.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[40px] border border-white/10 bg-white/5 py-32 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10">
              <Star size={28} className="text-white/30" />
            </div>
            <p className="font-bold text-white/40">
              Tidak ada testimoni{" "}
              {filter !== "all" ? filter : ""}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {testimoniList.map((t) => (
              <div
                key={t.id}
                className="group relative flex flex-col rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/8"
              >
                {/* Status Badge */}
                <div className="mb-4 flex items-center justify-between">
                  <StatusBadge status={t.status} />
                  <StarRating rating={t.rating} />
                </div>

                {/* Message */}
                <p className="mb-4 flex-1 text-sm leading-relaxed text-white/70">
                  "{t.message}"
                </p>

                {/* Photo (jika ada) */}
                {t.photo_url && (
                  <button
                    onClick={() => setExpandedPhoto(t.photo_url!)}
                    className="mb-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/50 transition hover:border-blue-500/30 hover:text-blue-300"
                  >
                    <ImageIcon size={13} />
                    Lihat foto
                  </button>
                )}

                {/* Customer Info */}
                <div className="mb-5 space-y-1.5 rounded-2xl border border-white/10 bg-black/30 p-3">
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <User size={12} />
                    <span className="font-semibold text-white/70">{t.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Mail size={12} />
                    {t.customer_email}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/30">
                    <Calendar size={12} />
                    {new Date(t.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {t.status !== "approved" && (
                    <button
                      onClick={() => handleAction(t.id, "approved")}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500/20 py-2.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/30"
                    >
                      <Check size={14} />
                      Setujui
                    </button>
                  )}
                  {t.status !== "rejected" && (
                    <button
                      onClick={() => handleAction(t.id, "rejected")}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-500/20 py-2.5 text-xs font-bold text-amber-300 transition hover:bg-amber-500/30"
                    >
                      <X size={14} />
                      Tolak
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmDelete(t.id)}
                    className="flex items-center justify-center rounded-2xl bg-red-500/15 px-3 py-2.5 text-red-400 transition hover:bg-red-500/25"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer count */}
        {!loading && testimoniList.length > 0 && (
          <p className="mt-6 text-center text-xs text-white/25">
            {testimoniList.length} testimoni ditampilkan
          </p>
        )}
      </div>
    </div>
  );
}