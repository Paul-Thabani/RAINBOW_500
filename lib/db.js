import { Pool } from "pg";

// Server-only. The database listens on localhost and is not reachable from
// anywhere else, so the network is the security boundary here: there are no
// table policies to get right, and the browser never talks to Postgres. The
// shirt reads through GET /api/squares and everything else goes through the
// API routes.
//
// Never import this from a Client Component.

// One pool per process, cached on globalThis. Next's dev server re-evaluates
// modules on hot reload, which would otherwise leak a pool and its connections
// on every edit until Postgres refused new ones.
const globalForDb = globalThis;

export function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL isn't set - add it to .env.local (see .env.local.example)");
  }
  if (!globalForDb.__rainbow500Pool) {
    globalForDb.__rainbow500Pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }
  return globalForDb.__rainbow500Pool;
}

// Throws on failure rather than returning an error, so callers use try/catch.
// Postgres error codes come through on `err.code`, so a unique-index violation
// is still `err.code === "23505"`.
export async function query(text, params) {
  return getPool().query(text, params);
}

// `numeric` columns come back from pg as strings, not numbers, so anything
// reading order_amount has to coerce. Kept here so that is stated once.
export function amount(value) {
  return Number(value) || 0;
}
