"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import ChatWidget from "../components/ChatWidget";

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

export default function Home() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [testimonials, setTestimonials] = useState<Testimoni[]>([]);

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

  // Fetch 3 approved testimoni untuk preview di homepage
  useEffect(() => {
    fetch("/api/testimonials?status=approved")
      .then((res) => res.json())
      .then((data) => {
        const list: Testimoni[] = Array.isArray(data) ? data : (data.testimonials ?? []);
        setTestimonials(list.slice(0, 3));
      })
      .catch(() => setTestimonials([]));
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
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
      </section>

      {/* ── Feature Badges ─────────────────────────────────────────────────── */}
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

      {/* ── Products ───────────────────────────────────────────────────────── */}
      <section id="produk" className="bg-[#f5f5f7] px-6 py-24 text-black">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
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

          {products.length === 0 ? (
            <div className="rounded-[36px] bg-white p-10 text-center shadow-sm">
              <p className="text-lg font-bold text-neutral-500">
                Belum ada produk dari database.
              </p>
            </div>
          ) : (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.08 }}
                  viewport={{ once: true }}
                >
                  <ProductCard
                    product={{
                      id: product.slug,
                      name: product.name,
                      category: product.category,
                      image: product.image_url,
                      price: `Rp ${Number(product.base_price).toLocaleString(
                        "id-ID"
                      )}`,
                      desc: product.description,
                    }}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Testimonials Preview ───────────────────────────────────────────── */}
      <section id="testimoni" className="bg-black px-6 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          {/* Section header */}
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

          {/* Testimoni preview cards */}
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
                  {/* Stars */}
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
                  {/* Message */}
                  <p className="mb-5 text-sm leading-relaxed text-white/65">
                    &ldquo;{t.message}&rdquo;
                  </p>
                  {/* Name */}
                  <p className="text-sm font-bold text-white/80">— {t.customer_name}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="mb-10 rounded-[32px] border border-white/10 bg-white/5 py-16 text-center">
              <Star size={32} className="mx-auto mb-3 text-white/20" />
              <p className="text-white/40">Belum ada testimoni tersedia.</p>
            </div>
          )}

          {/* CTA button */}
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

      {/* ── Experience Section ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-black px-6 py-28 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#2563eb55_0%,transparent_35%),radial-gradient(circle_at_80%_60%,#9333ea55_0%,transparent_35%)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-4 text-sm font-black uppercase tracking-[0.35em] text-blue-300">
              Markas Experience
            </p>

            <h2 className="mb-6 text-6xl font-black leading-none tracking-[-0.07em] md:text-8xl">
              Bukan cuma toko.
              <br />
              Ini experience.
            </h2>

            <p className="max-w-xl text-lg leading-8 text-white/55">
              UI premium, animasi halus, katalog rapi, checkout manual transfer,
              dan database MySQL lokal dari XAMPP.
            </p>
          </div>

          <motion.div
            animate={{ rotate: [0, 2, -2, 0], y: [0, -16, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="rounded-[50px] border border-white/10 bg-white/10 p-10 backdrop-blur-2xl"
          >
            <img
              src="https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/macbook-air-13-m3-midnight-select-202402?wid=900&hei=900&fmt=png-alpha&.v=1708367688034"
              alt="MacBook"
              className="mx-auto max-h-[420px] object-contain drop-shadow-2xl"
            />
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