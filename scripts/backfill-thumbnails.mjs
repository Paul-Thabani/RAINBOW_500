#!/usr/bin/env node
//
// One-off backfill of squares.content_thumb and squares.content_meta.
//
// Every square sold before those two columns existed has its artwork only as
// full-resolution base64 in `content`. The board no longer reads `content`, so
// until this has run those squares render as blank claimed blocks: the artwork
// is not lost, it is just not addressable at board size yet.
//
// Run it once, by hand, straight after applying db/schema.sql:
//
//   node scripts/backfill-thumbnails.mjs            # do it
//   node scripts/backfill-thumbnails.mjs --dry-run  # just say what it would do
//
// Safe to re-run. It only touches rows where content_meta is still null, so a
// second run is a no-op and an interrupted run picks up where it stopped. It
// reads `content` and never writes it, so the file that gets printed on the
// shirt is not modified.
//
// A row whose image sharp cannot read gets its content_meta written and its
// content_thumb left null, and is then considered done. That square keeps
// rendering as a plain claimed block, and its original is still served by
// /api/square/{id}/art. To make this script try such a row again, null its
// content_meta first.
//
// DATABASE_URL comes from the environment if set, otherwise from .env.local
// next to this repo, the same place scripts/backup-db.sh looks.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { artMeta, makeThumb } from "../lib/artwork.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY_RUN = process.argv.includes("--dry-run");

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envFile = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envFile)) {
    throw new Error(`DATABASE_URL is not set and there is no ${envFile}`);
  }
  const line = fs
    .readFileSync(envFile, "utf8")
    .split("\n")
    .find((l) => l.startsWith("DATABASE_URL="));
  if (!line) throw new Error(`DATABASE_URL is not set and is not in ${envFile}`);
  return line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
}

const client = new pg.Client({ connectionString: databaseUrl() });
await client.connect();

// Ids first, content one row at a time. Some of these rows are the better part
// of a megabyte and there can be 500 of them, so pulling the lot into memory to
// resize them would be a poor trade for a script that has all the time it needs.
const { rows: todo } = await client.query(
  `select id from squares where content is not null and content_meta is null order by created_at`
);

console.log(
  `${todo.length} square${todo.length === 1 ? "" : "s"} to backfill${DRY_RUN ? " (dry run, nothing will be written)" : ""}`
);

let images = 0;
let text = 0;
let unreadable = 0;
let thumbBytes = 0;

for (const [i, { id }] of todo.entries()) {
  const { rows } = await client.query(`select content from squares where id = $1`, [id]);
  const content = rows[0] && rows[0].content;
  if (!content) continue;

  const meta = artMeta(content);
  const thumb = await makeThumb(content);

  if (content.type === "image") {
    if (thumb) {
      images++;
      thumbBytes += thumb.length;
    } else {
      unreadable++;
      console.warn(`  ${id}: image could not be resized, leaving it without a thumbnail`);
    }
  } else {
    text++;
  }

  if (!DRY_RUN) {
    await client.query(`update squares set content_thumb = $1, content_meta = $2 where id = $3`, [
      thumb,
      meta,
      id,
    ]);
  }

  if ((i + 1) % 25 === 0) console.log(`  ${i + 1}/${todo.length}`);
}

const avg = images ? Math.round(thumbBytes / images) : 0;
console.log(
  `done: ${images} thumbnail${images === 1 ? "" : "s"} (${thumbBytes} bytes total, ${avg} average), ` +
    `${text} text-only, ${unreadable} unreadable`
);

await client.end();
