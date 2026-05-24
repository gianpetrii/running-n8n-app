/**
 * Prueba conexión a Supabase usando DATABASE_URL de .env.local
 * Uso: npm run db:test
 */
import { setDefaultResultOrder } from "node:dns/promises";
import postgres from "postgres";

setDefaultResultOrder("ipv4first");

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
  console.error("Falta DATABASE_URL en .env.local");
  process.exit(1);
}

const parsed = new URL(rawUrl);
const servername = parsed.hostname;
const isDirect = servername?.startsWith("db.") && servername?.includes(".supabase.co");
const isPooler = rawUrl.includes("pooler.supabase.com");

console.log("Host:", servername);
console.log("Puerto:", parsed.port || "5432");
if (isPooler) {
  console.log("Pooler (IPv4): conexión por hostname (no por IP, para SSL válido).");
}
if (isDirect) {
  console.log(
    "Nota: usá el pooler (6543), no db.*:5432, en WSL."
  );
}

const sql = postgres(rawUrl, {
  prepare: false,
  max: 1,
  ssl: rawUrl.includes("supabase.co") ? "require" : undefined,
  connect_timeout: 15,
});

try {
  const rows = await sql`select count(*)::int as n from events`;
  console.log("\nOK — conexión válida. Filas en events:", rows[0].n);
} catch (e) {
  console.error("\nError:", e.message);
  if (e.message?.includes("password authentication failed")) {
    console.error("→ Contraseña incorrecta o mal codificada en la URL (! → %21).");
  } else if (e.message?.includes("certificate")) {
    console.error("→ No uses la IP en DATABASE_URL; solo el hostname del pooler.");
  } else if (e.message?.includes("ENETUNREACH") && isDirect) {
    console.error("→ Usá la URI del pooler (6543).");
  }
  process.exit(1);
} finally {
  await sql.end();
}
