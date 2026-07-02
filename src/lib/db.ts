import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

// ─── Config ───────────────────────────────────────────────────────────────────
const useSSL = process.env.DB_SSL === "true";
const port = parseInt(process.env.DB_PORT || "3306");
const isServerless = !!process.env.VERCEL;

// ─── SSL Config ──────────────────────────────────────────────────────────────
// TiDB Cloud membutuhkan TLSv1.2 minimum. CA cert opsional — mysql2 akan
// fallback ke system root CAs kalau file tidak ditemukan (cukup untuk TiDB Cloud).
function buildSSLConfig() {
  if (!useSSL) return undefined;

  const caCertPath = path.join(process.cwd(), "certs", "isrgrootx1.pem");
  const hasLocalCert = fs.existsSync(caCertPath);

  return {
    minVersion: "TLSv1.2" as const,
    rejectUnauthorized: true,
    ...(hasLocalCert && { ca: fs.readFileSync(caCertPath) }),
  };
}

// ─── Pool ─────────────────────────────────────────────────────────────────────
// Pool dibuat lazy (bukan langsung connect) — koneksi aktual baru terjadi
// saat query pertama dijalankan. Ini WAJIB untuk serverless environment,
// karena top-level side-effect (seperti connection test) akan ikut jalan
// saat Next.js build melakukan "Collecting page data", bukan cuma saat runtime.
export const db = mysql.createPool({
  host:     process.env.DB_HOST     || "localhost",
  port,
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME     || "markas_iphone",
  ssl:      buildSSLConfig(),
  waitForConnections: true,
  connectionLimit: isServerless ? 3 : 10,
  maxIdle:         isServerless ? 3 : 10,
  idleTimeout:     60_000,
  queueLimit:      0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10_000,
});