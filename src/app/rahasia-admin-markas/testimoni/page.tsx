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
  Plus,
  Pencil,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
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

type FormData = {
  customer_name: string;
  customer_email: string;
  rating: number;
  message: string;
  photo_url: string;
  status: "pending" | "approved" | "rejected";
};

const EMPTY_FORM: FormData = {
  customer_name: "",
  customer_email: "",
  rating: 5,
  message: "",
  photo_url: "",
  status: "approved",
};

const STATUS_TABS: { key: FilterStatus; label: string; Icon: React.ElementType }[] = [
  { key: "pending", label: "Pending", Icon: Clock },
  { key: "approved", label: "Approved", Icon: CheckCircle },
  { key: "rejected", label: "Rejected", Icon: XCircle },
  { key: "all", label: "Semua", Icon: List },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={
            s <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-white/10 text-white/20"
          }
        />
      ))}
    </div>
  );
}

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={22}
            className={
              s <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "fill-white/10 text-white/20"
            }
          />
        </button>
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
  const labels = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${map[status]}`}
    >
      {labels[status]}
    </span>
  );
}

// ─── Reusable styles ──────────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition focus:border-blue-500/50 focus:bg-white/8 focus:ring-2 focus:ring-blue-500/20";
const labelCls = "mb-1.5 block text-xs font-bold text-white/50";

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function TestimoniModal({
  mode,
  initial,
  onClose,
  onSaved,
}: {
  mode: "add" | "edit";
  initial: FormData & { id?: number };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormData>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const set = (key: keyof FormData, val: FormData[keyof FormData]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  // ── File → Base64 ──────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran gambar terlalu besar. Maksimal 2MB.");
      return;
    }
    setUploading(true);
    setError("");

    const reader = new FileReader();
    reader.onloadend = () => {
      set("photo_url", reader.result as string);
      setUploading(false);
    };
    reader.onerror = () => {
      setError("Gagal membaca file gambar.");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (
      !form.customer_name.trim() ||
      !form.customer_email.trim() ||
      !form.message.trim()
    ) {
      setError("Nama, email, dan pesan wajib diisi.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = mode === "edit" ? { id: initial.id, ...form } : form;
      const res = await fetch("/api/testimonials", {
        method: mode === "add" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-request": "true",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Gagal menyimpan");
      }
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[28px] border border-white/10 bg-[#111] p-7 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                mode === "add" ? "bg-blue-500/20" : "bg-amber-500/20"
              }`}
            >
              {mode === "add" ? (
                <Plus size={18} className="text-blue-400" />
              ) : (
                <Pencil size={18} className="text-amber-400" />
              )}
            </div>
            <h2 className="text-lg font-black">
              {mode === "add" ? "Tambah Testimoni" : "Edit Testimoni"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          {/* Nama */}
          <div>
            <label className={labelCls}>Nama Pelanggan *</label>
            <input
              className={inputCls}
              placeholder="Budi Santoso"
              value={form.customer_name}
              onChange={(e) => set("customer_name", e.target.value)}
            />
          </div>

          {/* Email */}
          <div>
            <label className={labelCls}>Email Pelanggan *</label>
            <input
              type="email"
              className={inputCls}
              placeholder="budi@email.com"
              value={form.customer_email}
              onChange={(e) => set("customer_email", e.target.value)}
            />
          </div>

          {/* Rating */}
          <div>
            <label className={labelCls}>Rating</label>
            <StarInput value={form.rating} onChange={(v) => set("rating", v)} />
          </div>

          {/* Pesan */}
          <div>
            <label className={labelCls}>Pesan / Ulasan *</label>
            <textarea
              className={`${inputCls} min-h-[100px] resize-none`}
              placeholder="Produknya bagus, pengiriman cepat..."
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
            />
          </div>

          {/* ── Upload Foto ── (benar: ada di dalam modal, punya akses ke form/set/uploading) */}
          <div>
            <label className={labelCls}>Foto Pelanggan (opsional)</label>

            {form.photo_url ? (
              /* Preview jika sudah ada foto */
              <div className="mt-2 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                <img
                  src={form.photo_url}
                  alt="Preview"
                  className="h-16 w-16 rounded-xl border border-white/10 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-white/40">
                    Gambar siap disimpan
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => set("photo_url", "")}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
                  title="Hapus foto"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              /* Drop-zone upload */
              <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-6 text-center transition hover:border-blue-500/50 hover:bg-white/8">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/60">
                  <ImageIcon size={20} />
                </div>
                <p className="text-xs font-semibold text-white/60">
                  {uploading
                    ? "Memproses gambar..."
                    : "Klik untuk pilih foto dari device"}
                </p>
                <p className="mt-1 text-[10px] text-white/30">
                  Maksimal ukuran file 2MB
                </p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {/* Status */}
          <div>
            <label className={labelCls}>Status</label>
            <select
              className={inputCls}
              value={form.status}
              onChange={(e) =>
                set("status", e.target.value as FormData["status"])
              }
            >
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-bold transition hover:bg-white/10"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || uploading}
            className={`flex-1 rounded-2xl py-3 text-sm font-bold text-white transition disabled:opacity-50 ${
              mode === "add"
                ? "bg-blue-600 hover:bg-blue-500"
                : "bg-amber-600 hover:bg-amber-500"
            }`}
          >
            {saving ? "Menyimpan..." : mode === "add" ? "Tambah" : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminTestimoniPage() {
  const [testimoniList, setTestimoniList] = useState<Testimoni[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<
    (FormData & { id: number }) | null
  >(null);

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
      const url = filter === "all"
        ? "/api/testimonials?admin=true"
        : `/api/testimonials?admin=true&status=${filter}`;

      const res = await fetch(url, {
        headers: { "x-admin-request": "true" }, // ← tambah ini
      });
      const data = await res.json();
      setTestimoniList(Array.isArray(data) ? data : []);
    } catch {
      showToast("Gagal memuat data testimoni", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleAction = async (
    id: number,
    status: "approved" | "rejected"
  ) => {
    try {
      const res = await fetch("/api/testimonials", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-request": "true", // ← tambah ini
        },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
      showToast(
        status === "approved" ? "Testimoni disetujui ✓" : "Testimoni ditolak"
      );
      fetchData();
    } catch {
      showToast("Gagal mengubah status", "error");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/testimonials?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-request": "true" },
      });
      if (!res.ok) throw new Error();
      showToast("Testimoni dihapus");
      setConfirmDelete(null);
      fetchData();
    } catch {
      showToast("Gagal menghapus", "error");
    }
  };

  const openEdit = (t: Testimoni) => {
    setEditTarget({
      id: t.id,
      customer_name: t.customer_name,
      customer_email: t.customer_email,
      rating: t.rating,
      message: t.message,
      photo_url: t.photo_url ?? "",
      status: t.status,
    });
  };

  const handleModalSaved = (mode: "add" | "edit") => {
    setAddOpen(false);
    setEditTarget(null);
    showToast(
      mode === "add"
        ? "Testimoni berhasil ditambahkan ✓"
        : "Testimoni berhasil diperbarui ✓"
    );
    fetchData();
  };

  const pendingCount = testimoniList.filter((t) => t.status === "pending").length;

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

      {/* Add Modal */}
      {addOpen && (
        <TestimoniModal
          mode="add"
          initial={{ ...EMPTY_FORM }}
          onClose={() => setAddOpen(false)}
          onSaved={() => handleModalSaved("add")}
        />
      )}

      {/* Edit Modal */}
      {editTarget && (
        <TestimoniModal
          mode="edit"
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => handleModalSaved("edit")}
        />
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-[28px] border border-white/10 bg-[#111] p-7 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/20">
              <Trash2 size={22} className="text-red-400" />
            </div>
            <h3 className="mb-2 text-lg font-black">Hapus Testimoni?</h3>
            <p className="mb-6 text-sm text-white/50">
              Aksi ini tidak bisa dibatalkan.
            </p>
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500"
            >
              <Plus size={16} />
              Tambah
            </button>
            <Link
              href="/rahasia-admin-markas/dashboard"
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft size={16} />
              Dashboard
            </Link>
          </div>
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
              {key === "pending" && pendingCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
                  {pendingCount}
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
              Tidak ada testimoni{filter !== "all" ? ` ${filter}` : ""}
            </p>
            <button
              onClick={() => setAddOpen(true)}
              className="mt-5 flex items-center gap-2 rounded-2xl bg-blue-600/20 px-5 py-2.5 text-sm font-bold text-blue-300 transition hover:bg-blue-600/30"
            >
              <Plus size={15} />
              Tambah Sekarang
            </button>
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
                  &ldquo;{t.message}&rdquo;
                </p>

                {/* Photo thumbnail — hanya tampil jika ada, klik untuk lightbox */}
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
                    <span className="font-semibold text-white/70">
                      {t.customer_name}
                    </span>
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
                    onClick={() => openEdit(t)}
                    className="flex items-center justify-center rounded-2xl bg-blue-500/15 px-3 py-2.5 text-blue-400 transition hover:bg-blue-500/25"
                    title="Edit testimoni"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(t.id)}
                    className="flex items-center justify-center rounded-2xl bg-red-500/15 px-3 py-2.5 text-red-400 transition hover:bg-red-500/25"
                    title="Hapus testimoni"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && testimoniList.length > 0 && (
          <p className="mt-6 text-center text-xs text-white/25">
            {testimoniList.length} testimoni ditampilkan
          </p>
        )}
      </div>
    </div>
  );
}