import { lookup, setDefaultResultOrder } from "node:dns/promises";
import net from "node:net";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

setDefaultResultOrder("ipv4first");

type Db = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  db: Db | undefined;
  init: Promise<Db> | undefined;
};

async function resolveConnectUrl(rawUrl: string): Promise<{
  connectUrl: string;
  servername: string;
  isSupabase: boolean;
}> {
  const parsed = new URL(rawUrl);
  const servername = parsed.hostname;
  const isSupabase = rawUrl.includes("supabase.co");
  const isPooler = rawUrl.includes("pooler.supabase.com");

  // Pooler: conectar por hostname (IPv4 vía DNS); no reemplazar por IP (rompe SSL).
  if (!isPooler && servername && !net.isIP(servername)) {
    try {
      const { address } = await lookup(servername, { family: 4 });
      parsed.hostname = address;
    } catch {
      // db.*.supabase.co directo suele ser solo IPv6
    }
  }

  return { connectUrl: parsed.toString(), servername, isSupabase };
}

async function createDb(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const { connectUrl, servername, isSupabase } = await resolveConnectUrl(url);
  const sql = postgres(connectUrl, {
    prepare: false,
    max: 1,
    ...(isSupabase ? { ssl: "require" as const } : {}),
  });

  return drizzle(sql, { schema });
}

/** Conexión lazy; en WSL fuerza IPv4 para Supabase. */
export async function getDb(): Promise<Db> {
  if (globalForDb.db) {
    return globalForDb.db;
  }
  if (!globalForDb.init) {
    globalForDb.init = createDb().then((db) => {
      globalForDb.db = db;
      return db;
    });
  }
  return globalForDb.init;
}

export { schema };
