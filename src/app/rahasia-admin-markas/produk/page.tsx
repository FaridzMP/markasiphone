"use client";

import {
  ArrowLeft,
  Edit3,
  ImageIcon,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Product = {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string;
  image_url: string;
  base_price: number;
  stock: number;
  is_active: boolean;
  created_at: string;
};

type FormState = {
  name: string;
  slug: string;
  category: string;
  base_price: string;
  stock: string;
  image_url: string;
  description: string;
};

type Toast = { id: number; message: string; type: "success" | "error" };

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FORM: FormState = {
  name: "", slug: "", category: "", base_price: "",
  stock: "0", image_url: "", description: "",
};

const CATEGORIES = ["iPhone", "iPad", "MacBook", "Apple Watch", "AirPods", "Aksesori"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(text: string) {
  return text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToastList({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-bold shadow-xl backdrop-blur-xl ${
            t.type === "success"
              ? "border-green-500/30 bg-green-900/80 text-green-200"
              : "border-red-500/30 bg-red-900/80 text-red-200"
          }`}
        >
          {t.type === "success" ? <CheckCircle2 size={16} className="shrink-0" /> : <X size={16} className="shrink-0" />}
          {t.message}
          <button onClick={() => onDismiss(t.id)} className="ml-2 opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function DeleteModal({
  product, onConfirm, onCancel, loading,
}: {
  product: Product; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[32px] border border-white/10 bg-[#0a0c14] p-8 shadow-2xl">
        {product.image_url && (
          <div className="mb-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-white p-3">
            <img src={product.image_url} alt={product.name} className="max-h-full object-contain" />
          </div>
        )}
        <h2 className="text-2xl font-black text-white">Hapus Produk?</h2>
        <p className="mt-2 text-white/50">
          <span className="font-bold text-white">{product.name}</span> akan dihapus dari database secara permanen.
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-2xl border border-white/10 bg-white/10 py-3 font-bold text-white transition hover:bg-white/20">
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminProdukPage() {
  const router = useRouter();

  const [products, setProducts]         = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [editId, setEditId]             = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deletingId, setDeletingId]     = useState<number | null>(null);
  const [form, setForm]                 = useState<FormState>(EMPTY_FORM);
  const [toasts, setToasts]             = useState<Toast[]>([]);
  const toastCounter                    = useRef(0);
  const formTopRef                      = useRef<HTMLDivElement>(null);

  // ── Auth check ──
  useEffect(() => {
    if (localStorage.getItem("markas_admin_logged_in") !== "true") {
      router.push("/rahasia-admin-markas/login");
      return;
    }
    fetchProducts();
  }, [router]);

  // ── Auto-dismiss toasts ──
  useEffect(() => {
    if (toasts.length === 0) return;
    const t = setTimeout(() => setToasts((prev) => prev.slice(1)), 4000);
    return () => clearTimeout(t);
  }, [toasts]);

  // ── Toast helper ──
  function addToast(message: string, type: "success" | "error") {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // ── Field helpers ──
  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleNameChange(value: string) {
    setForm((prev) => ({ ...prev, name: value, slug: toSlug(value) }));
  }

  // ── Fetch ──
  async function fetchProducts() {
    try {
      setLoadingProducts(true);
      const res  = await fetch("/api/products");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : (data.products ?? []));
    } catch {
      addToast("Gagal memuat produk", "error");
    } finally {
      setLoadingProducts(false);
    }
  }

  // ── Upload image ──
  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Upload gagal");
      setField("image_url", data.imageUrl);
      addToast("Gambar berhasil diupload", "success");
    } catch (err: any) {
      addToast(err.message ?? "Upload gagal", "error");
    } finally {
      setUploading(false);
    }
  }

  // ── Start edit ──
  function startEdit(product: Product) {
    setEditId(product.id);
    setForm({
      name:        product.name,
      slug:        product.slug,
      category:    product.category,
      base_price:  String(product.base_price),
      stock:       String(product.stock ?? 0),
      image_url:   product.image_url,
      description: product.description,
    });
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ── Reset form ──
  function resetForm() {
    setEditId(null);
    setForm(EMPTY_FORM);
  }

  // ── Validate ──
  function validate(): string | null {
    if (!form.name.trim())       return "Nama produk wajib diisi";
    if (!form.category.trim())   return "Kategori wajib dipilih";
    if (!form.base_price || Number(form.base_price) <= 0) return "Harga harus lebih dari 0";
    if (!form.image_url)         return "Gambar produk wajib diupload";
    return null;
  }

  // ── Submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { addToast(err, "error"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method:  editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          id:          editId,
          name:        form.name,
          slug:        form.slug || toSlug(form.name),
          category:    form.category,
          description: form.description,
          image_url:   form.image_url,
          base_price:  Number(form.base_price),
          stock:       Number(form.stock),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Gagal menyimpan");
      addToast(editId ? "Produk berhasil diupdate" : "Produk berhasil ditambahkan", "success");
      resetForm();
      fetchProducts();
    } catch (err: any) {
      addToast(err.message ?? "Terjadi kesalahan", "error");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Delete ──
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      const res  = await fetch(`/api/products?id=${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Gagal hapus");
      addToast("Produk berhasil dihapus", "success");
      if (editId === deleteTarget.id) resetForm();
      setDeleteTarget(null);
      fetchProducts();
    } catch (err: any) {
      addToast(err.message ?? "Gagal hapus produk", "error");
    } finally {
      setDeletingId(null);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen overflow-hidden bg-black p-6 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#2563eb44_0%,transparent_40%),radial-gradient(circle_at_bottom_right,#9333ea44_0%,transparent_40%)]" />

      <section className="relative z-10 mx-auto max-w-7xl">

        {/* ── Header ── */}
        <div className="mb-10 flex flex-wrap items-start justify-between gap-5">
          <div>
            <Link
              href="/rahasia-admin-markas/dashboard"
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-2.5 text-sm font-bold text-white/70 backdrop-blur-xl transition hover:text-white"
            >
              <ArrowLeft size={15} /> Dashboard
            </Link>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-blue-300">Product Manager</p>
            <h1 className="text-5xl font-black tracking-[-0.06em] md:text-6xl">CMS Produk.</h1>
            <p className="mt-3 text-base text-white/50">Tambah, edit, dan hapus produk dari database.</p>
          </div>

          <button
            onClick={fetchProducts}
            disabled={loadingProducts}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 font-bold text-white backdrop-blur-xl transition hover:bg-white/20 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loadingProducts ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[400px_1fr]">

          {/* ── Form Panel ── */}
          <div ref={formTopRef}>
            <form
              onSubmit={handleSubmit}
              className="sticky top-6 rounded-[40px] border border-white/10 bg-white/[0.06] p-7 backdrop-blur-2xl"
            >
              {/* Form header */}
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20">
                {editId ? <Edit3 size={26} className="text-blue-300" /> : <Plus size={26} className="text-blue-300" />}
              </div>
              <h2 className="mb-1 text-3xl font-black tracking-tight">
                {editId ? "Edit Produk" : "Tambah Produk"}
              </h2>
              <p className="mb-7 text-sm text-white/40">
                {editId ? "Ubah data lalu klik Update." : "Isi semua field lalu simpan ke database."}
              </p>

              <div className="space-y-4">
                {/* Nama */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-white/50">Nama Produk *</label>
                  <input
                    placeholder="Contoh: iPhone 15 Pro Max"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-bold text-white placeholder:text-white/25 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-white/50">Slug URL</label>
                  <input
                    placeholder="otomatis dari nama"
                    value={form.slug}
                    onChange={(e) => setField("slug", e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-mono font-bold text-white/70 placeholder:text-white/20 outline-none transition focus:border-blue-500"
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-white/50">Kategori *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setField("category", e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#0d1117] px-4 py-3.5 text-sm font-bold text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                  >
                    <option value="">Pilih kategori…</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Harga + Stok grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-white/50">Harga (Rp) *</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="18999000"
                      value={form.base_price}
                      onChange={(e) => setField("base_price", e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-bold text-white placeholder:text-white/25 outline-none transition focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-white/50">Stok</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={form.stock}
                      onChange={(e) => setField("stock", e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-bold text-white placeholder:text-white/25 outline-none transition focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Upload gambar */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <label className="mb-2 block text-xs font-bold text-white/50">Gambar Produk *</label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/20 p-4 transition hover:border-blue-500/50 hover:bg-white/5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/20">
                      {uploading ? <Loader2 size={18} className="animate-spin text-blue-300" /> : <ImageIcon size={18} className="text-blue-300" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white/70">{uploading ? "Mengupload…" : "Pilih gambar"}</p>
                      <p className="text-xs text-white/30">JPG, PNG, WebP • Maks 5MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(file);
                        e.target.value = "";
                      }}
                    />
                  </label>

                  {form.image_url && (
                    <div className="relative mt-3 overflow-hidden rounded-2xl bg-white p-3">
                      <img src={form.image_url} alt="Preview" className="h-44 w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setField("image_url", "")}
                        className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-white/50">Deskripsi</label>
                  <textarea
                    placeholder="Deskripsi singkat produk…"
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-bold text-white placeholder:text-white/25 outline-none transition focus:border-blue-500"
                  />
                </div>

                {/* Buttons */}
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-black text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting
                    ? <><Loader2 size={16} className="animate-spin" /> Menyimpan…</>
                    : <><Save size={16} /> {editId ? "Update Produk" : "Simpan ke Database"}</>}
                </button>

                {editId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3.5 font-bold text-white/70 transition hover:bg-white/10"
                  >
                    <X size={16} /> Batal Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* ── Product Grid ── */}
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tight">Daftar Produk</h2>
                <p className="text-sm text-white/40">
                  {loadingProducts ? "Memuat…" : `${products.length} produk di database`}
                </p>
              </div>
            </div>

            {/* Loading */}
            {loadingProducts && (
              <div className="flex items-center justify-center py-16 text-white/30">
                <Loader2 size={32} className="animate-spin" />
              </div>
            )}

            {/* Empty */}
            {!loadingProducts && products.length === 0 && (
              <div className="rounded-[40px] border border-white/10 bg-white/5 p-14 text-center">
                <Package size={48} className="mx-auto mb-4 text-white/20" />
                <h3 className="text-2xl font-black text-white/60">Belum ada produk</h3>
                <p className="mt-2 text-sm text-white/30">Tambahkan produk pertama dari form di sebelah kiri.</p>
              </div>
            )}

            {/* Grid */}
            {!loadingProducts && products.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`rounded-[32px] border p-5 transition ${
                      editId === product.id
                        ? "border-blue-500/50 bg-blue-500/10"
                        : "border-white/10 bg-white/[0.06] hover:bg-white/[0.09]"
                    }`}
                  >
                    {/* Product image */}
                    <div className="mb-4 flex h-48 items-center justify-center overflow-hidden rounded-[22px] bg-white p-4">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="max-h-full object-contain" />
                      ) : (
                        <Package size={48} className="text-neutral-300" />
                      )}
                    </div>

                    {/* Meta */}
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-black text-blue-300">
                        {product.category}
                      </span>
                      <span className="text-xs text-white/30">#{product.id}</span>
                    </div>

                    <h3 className="mt-2 text-xl font-black leading-snug">{product.name}</h3>

                    {product.description && (
                      <p className="mt-1.5 line-clamp-2 text-sm text-white/40">{product.description}</p>
                    )}

                    {/* Price + Stock */}
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xl font-black">{formatRupiah(product.base_price)}</p>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${
                        (product.stock ?? 0) > 0
                          ? "bg-green-500/20 text-green-300"
                          : "bg-red-500/20 text-red-300"
                      }`}>
                        Stok: {product.stock ?? 0}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => startEdit(product)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-blue-500/20 py-2.5 text-sm font-bold text-blue-300 transition hover:bg-blue-500 hover:text-white"
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(product)}
                        className="flex items-center justify-center gap-1.5 rounded-2xl bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Delete modal ── */}
      {deleteTarget && (
        <DeleteModal
          product={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deletingId === deleteTarget.id}
        />
      )}

      {/* ── Toasts ── */}
      <ToastList toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}