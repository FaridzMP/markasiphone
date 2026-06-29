"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CreditCard,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  X,
  Sun,
  Moon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import ChatWidget from "../components/ChatWidget";
import { BannerCarousel } from "@/components/BannerCarousel";

// ─── Types ────────────────────────────────────────────────────────────────────
type DbProduct = {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string;
  image_url: string;
  base_price: number;
  created_at: string;
};

type Testimoni = {
  id: number;
  customer_name: string;
  rating: number;
  message: string;
  photo_url: string | null;
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [testimonials, setTestimonials] = useState<Testimoni[]>([]);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Semua");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isDarkMode, setIsDarkMode] = useState(true); // Default true agar tetap cinematic di awal

  useEffect(() => {
    // Sinkronisasi dengan localStorage atau preference sistem jika ada
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const nextTheme = !prev;
      localStorage.setItem("theme", nextTheme ? "dark" : "light");
      return nextTheme;
    });
  };

  // ── Fetch products ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.error || data.message) {
          console.error("API Error:", data.message);
          setProducts([]);
          return;
        }
        const list = Array.isArray(data) ? data : (data.products ?? []);
        setProducts(list);
      })
      .catch((error) => {
        console.error("Gagal ambil produk:", error);
        setProducts([]);
      });
  }, []);

  // ── Fetch testimonials ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/testimonials?status=approved")
      .then((res) => res.json())
      .then((data) => {
        const list: Testimoni[] = Array.isArray(data)
          ? data
          : (data.testimonials ?? []);
        setTestimonials(list.slice(0, 3));
      })
      .catch(() => setTestimonials([]));
  }, []);

  // ── Debounce search input ───────────────────────────────────────────────────
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ── Derive categories from products ────────────────────────────────────────
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);
    return ["Semua", ...cats.sort()];
  }, [products]);

  // ── Filter products ────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      const matchCategory =
        activeCategory === "Semua" || p.category === activeCategory;
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [products, search, activeCategory]);

  const hasActiveFilter = searchInput !== "" || activeCategory !== "Semua";

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <main className={`min-h-screen overflow-hidden transition-colors duration-500 ${isDarkMode ? "bg-black text-white" : "bg-[#f5f5f7] text-neutral-900"}`}>
      <Navbar />

      <button
        onClick={toggleDarkMode}
        className={`fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border shadow-2xl transition-all duration-300 hover:scale-110 ${
          isDarkMode 
            ? "border-white/10 bg-white/10 text-amber-400 backdrop-blur-xl hover:bg-white/20" 
            : "border-black/10 bg-white text-indigo-600 hover:bg-neutral-100"
        }`}
        aria-label="Toggle Dark Mode"
      >
        {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen overflow-hidden bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#2563eb55_0%,transparent_32%),radial-gradient(circle_at_80%_10%,#9333ea55_0%,transparent_28%),radial-gradient(circle_at_50%_90%,#06b6d455_0%,transparent_32%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,black_85%)]" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-6 py-28 lg:grid-cols-2"
        >
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2 text-sm font-bold text-white/80 backdrop-blur-xl">
              <Sparkles size={16} />
              Premium Apple Store Experience
            </div>

            <h1 className="mb-6 text-7xl font-black leading-none tracking-[-0.08em] md:text-9xl">
              iPhone
              <span className="block bg-gradient-to-r from-blue-300 via-white to-purple-300 bg-clip-text text-transparent">
                15 Pro.
              </span>
            </h1>

            <p className="mx-auto mb-9 max-w-xl text-xl leading-9 text-white/60 lg:mx-0">
              Website toko Apple dengan UI cinematic, glossy, modern, dan katalog
              produk premium.
            </p>

            <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
              <Link
                href="#produk"
                className="group inline-flex items-center gap-3 rounded-full bg-white px-8 py-5 font-black text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_60px_rgba(255,255,255,0.25)]"
              >
                Explore Produk
                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="#produk"
                className="rounded-full border border-white/10 bg-white/10 px-8 py-5 font-black text-white backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/20"
              >
                Lihat Koleksi
              </Link>
            </div>
          </div>

          <motion.div
            animate={{ y: [0, -22, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="relative flex justify-center"
          >
            <div className="absolute h-[460px] w-[460px] rounded-full bg-blue-500/30 blur-3xl" />
            <div className="absolute bottom-0 h-32 w-96 rounded-full bg-white/20 blur-3xl" />
            <img
              src="https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/iphone-15-pro-model-unselect-gallery-2-202309?wid=1400&hei=1400&fmt=png-alpha&.v=1693010533312"
              alt="iPhone 15 Pro"
              className="relative z-10 max-h-[640px] object-contain drop-shadow-[0_40px_80px_rgba(59,130,246,0.45)]"
            />
          </motion.div>
        </motion.div>
        <BannerCarousel />
      </section>

      {/* ── Feature Badges ───────────────────────────────────────────────── */}
      <section className="relative z-10 -mt-24 px-6 pb-20">
        <div className="mx-auto grid max-w-7xl gap-5 rounded-[40px] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-2xl md:grid-cols-3">
          <div className="rounded-[32px] bg-white/10 p-7 backdrop-blur-xl">
            <Truck className="mb-5 text-blue-300" size={30} />
            <h3 className="mb-2 text-2xl font-black">Gratis Ongkir</h3>
            <p className="text-white/55">Untuk area tertentu.</p>
          </div>
          <div className="rounded-[32px] bg-white/10 p-7 backdrop-blur-xl">
            <ShieldCheck className="mb-5 text-blue-300" size={30} />
            <h3 className="mb-2 text-2xl font-black">Garansi Resmi</h3>
            <p className="text-white/55">Produk original dan bergaransi.</p>
          </div>
          <div className="rounded-[32px] bg-white/10 p-7 backdrop-blur-xl">
            <CreditCard className="mb-5 text-blue-300" size={30} />
            <h3 className="mb-2 text-2xl font-black">Cicilan Mudah</h3>
            <p className="text-white/55">Pembayaran fleksibel.</p>
          </div>
        </div>
      </section>

      {/* ── Products ─────────────────────────────────────────────────────── */}
      <section id="produk" className="bg-[#f5f5f7] px-6 py-24 text-black">
        <div className="mx-auto max-w-7xl">
          {/* Section header */}
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.35em] text-blue-600">
              Product Collection
            </p>
            <h2 className="text-6xl font-black tracking-[-0.07em] md:text-8xl">
              Pilihan Premium.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-neutral-500">
              Pilih produk Apple favorit kamu dari database Markas iPhone.
            </p>
          </div>

          {/* ── Search + Filter ── */}
          <div className="mb-8 flex flex-col gap-4">
            {/* Search bar */}
            <div className="relative mx-auto w-full max-w-xl">
              <Search
                size={18}
                className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="text"
                placeholder="Cari produk…"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-white py-4 pl-12 pr-11 font-bold text-black placeholder:text-neutral-400 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
              />
              {searchInput && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1 text-neutral-400 transition hover:text-black"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Category filter chips */}
            {categories.length > 1 && (
              <div className="flex flex-wrap justify-center gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`rounded-full border px-5 py-2 text-sm font-bold transition-all ${
                      activeCategory === cat
                        ? "border-blue-500 bg-blue-600 text-white shadow-md"
                        : "border-black/10 bg-white text-neutral-600 hover:border-blue-300 hover:text-blue-600"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product grid */}
          {products.length === 0 ? (
            <div className="rounded-[36px] bg-white p-10 text-center shadow-sm">
              <p className="text-lg font-bold text-neutral-500">
                Belum ada produk dari database.
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-[36px] bg-white p-14 text-center shadow-sm">
              <Search size={40} className="mx-auto mb-4 text-neutral-300" />
              <p className="text-xl font-black text-neutral-500">
                Produk tidak ditemukan
              </p>
              <p className="mt-2 text-neutral-400">
                Tidak ada produk yang cocok dengan{" "}
                {searchInput ? `"${searchInput}"` : ""}
                {searchInput && activeCategory !== "Semua" ? " di " : ""}
                {activeCategory !== "Semua" ? `kategori "${activeCategory}"` : ""}
                .
              </p>
              {hasActiveFilter && (
                <button
                  onClick={() => {
                    handleSearchChange("");
                    setActiveCategory("Semua");
                  }}
                  className="mt-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-neutral-100 px-6 py-3 text-sm font-bold text-neutral-600 transition hover:bg-neutral-200"
                >
                  <X size={15} />
                  Hapus filter
                </button>
              )}
            </div>
          ) : (
            <>
              {hasActiveFilter && (
                <p className="mb-5 text-sm font-bold text-neutral-500">
                  {filteredProducts.length} produk ditemukan
                  {searchInput ? ` untuk "${searchInput}"` : ""}
                  {activeCategory !== "Semua"
                    ? ` dalam kategori "${activeCategory}"`
                    : ""}
                </p>
              )}
              <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 35 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: Math.min(index * 0.08, 0.4) }}
                    viewport={{ once: true }}
                  >
                    <ProductCard
                      product={{
                        id: product.slug,
                        name: product.name,
                        category: product.category,
                        image: product.image_url,
                        price: `Rp ${Number(product.base_price).toLocaleString("id-ID")}`,
                        desc: product.description,
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Testimonials Preview ─────────────────────────────────────────── */}
      <section id="testimoni" className="bg-black px-6 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.35em] text-blue-400">
              Kata Mereka
            </p>
            <h2 className="text-5xl font-black tracking-[-0.06em] md:text-7xl">
              Testimoni
              <span className="block bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                Pelanggan.
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/50">
              Pengalaman nyata dari pelanggan setia Markas iPhone.
            </p>
          </div>

          {testimonials.length > 0 ? (
            <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                >
                  <div className="mb-4 flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={15}
                        className={
                          s <= t.rating
                            ? "fill-amber-400 text-amber-400"
                            : "fill-white/10 text-white/20"
                        }
                      />
                    ))}
                  </div>
                  <p className="mb-5 text-sm leading-relaxed text-white/65">
                    &ldquo;{t.message}&rdquo;
                  </p>
                  <p className="text-sm font-bold text-white/80">
                    — {t.customer_name}
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="mb-10 rounded-[32px] border border-white/10 bg-white/5 py-16 text-center">
              <Star size={32} className="mx-auto mb-3 text-white/20" />
              <p className="text-white/40">Belum ada testimoni tersedia.</p>
            </div>
          )}

          <div className="text-center">
            <Link
              href="/testimoni"
              className="group inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-8 py-4 font-black text-white backdrop-blur-xl transition-all duration-300 hover:border-blue-500/40 hover:bg-blue-500/15 hover:shadow-[0_0_40px_rgba(59,130,246,0.2)]"
            >
              <Star size={18} className="text-amber-400" />
              Lihat Semua Testimoni Pelanggan
              <ArrowRight
                size={17}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Offline Store, Contact & Socials Section ─────────────────────── */}
      <section id="kontak" className={`relative overflow-hidden px-6 py-28 transition-colors duration-500 ${isDarkMode ? "bg-[#0b0b0c] text-white" : "bg-[#f5f5f7] text-black"}`}>
        {/* Dynamic Background Glow */}
        <div className={`absolute inset-0 transition-opacity duration-500 ${isDarkMode ? "opacity-100" : "opacity-20"}`}
          style={{
            backgroundImage: "radial-gradient(circle_at_30%_20%,#2563eb55_0%,transparent_35%), radial-gradient(circle_at_80%_60%,#9333ea55_0%,transparent_35%)"
          }}
        />

        <div className="relative mx-auto grid max-w-7xl items-start gap-12 lg:grid-cols-2">
          {/* ── Kiri: Alamat Offline Store ── */}
          <div>
            <p className="mb-4 text-sm font-black uppercase tracking-[0.35em] text-blue-500">
              Kunjungi Kami
            </p>
            <h2 className="mb-6 text-5xl font-black leading-none tracking-[-0.07em] md:text-7xl">
              Offline Store & <br />
              Markas Pusat.
            </h2>
            
            <div className="space-y-4 max-w-xl text-lg leading-8">
              <p className={isDarkMode ? "text-white/80 font-bold" : "text-neutral-900 font-bold"}>
                📍 Markas iPhone Official Store
              </p>
              <p className={isDarkMode ? "text-white/55" : "text-neutral-500"}>
                Jl. Utama No. 123, Lantai 2, Kota Jakarta Selatan, DKI Jakarta, 12345. <br />
                (Samping Mall Premium Apple, Seberang Stasiun Kota).
              </p>
              <p className="text-sm font-bold text-blue-500">
                Jam Operasional: Setiap Hari (10.00 - 22.00 WIB)
              </p>
            </div>

            {/* Tombol Google Maps */}
            <div className="mt-8">
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-3 rounded-full border px-7 py-3.5 font-black text-sm backdrop-blur-xl transition-all duration-300 ${
                  isDarkMode 
                    ? "border-white/10 bg-white/5 text-white hover:bg-white/10" 
                    : "border-black/10 bg-white text-neutral-900 hover:bg-neutral-50 shadow-sm"
                }`}
              >
                Buka di Google Maps
                <ArrowRight size={16} />
              </a>
            </div>
          </div>

          {/* ── Kanan: Kontak & Sosial Media Box ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={`rounded-[40px] border p-8 md:p-10 backdrop-blur-2xl shadow-xl ${
              isDarkMode ? "border-white/10 bg-white/5" : "border-black/5 bg-white"
            }`}
          >
            {/* Kontak Person */}
            <div className="mb-8">
              <h3 className="mb-4 text-xl font-black tracking-tight">Hubungi Chat Admin</h3>
              <p className={`mb-5 text-sm ${isDarkMode ? "text-white/55" : "text-neutral-500"}`}>
                Punya pertanyaan sebelum membeli? Chat admin kami langsung via WhatsApp untuk respon cepat.
              </p>
              
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-green-600 px-6 py-4 text-center font-black text-white transition hover:bg-green-500 hover:scale-[1.02] shadow-lg shadow-green-600/20"
              >
                Hubungi via WhatsApp
              </a>
            </div>

            <hr className={`my-6 ${isDarkMode ? "border-white/10" : "border-black/10"}`} />

            {/* Media Sosial */}
            <div>
              <h3 className="mb-4 text-xl font-black tracking-tight">Ikuti Media Sosial</h3>
              <p className={`mb-5 text-sm ${isDarkMode ? "text-white/55" : "text-neutral-500"}`}>
                Dapatkan info promo gadget Apple terbaru setiap harinya.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold transition ${
                    isDarkMode ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-black/5 bg-neutral-50 hover:bg-neutral-100"
                  }`}
                >
                  Instagram
                </a>
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold transition ${
                    isDarkMode ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-black/5 bg-neutral-50 hover:bg-neutral-100"
                  }`}
                >
                  TikTok
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black px-6 py-10 text-center text-sm text-white/40">
        © 2026 Markas iPhone. Premium cinematic store.
      </footer>
      <ChatWidget />
    </main>
  );
}