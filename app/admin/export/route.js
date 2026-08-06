import { query } from "../../../lib/db";

// Fulfilment export.
//
// Two formats, because they answer different questions:
//
//   /admin/export            a CSV of every paid order: who, what size, where
//                            it goes, and whether it is a collection or a post.
//                            This is the spreadsheet you work from.
//
//   /admin/export?format=zip a folder of the artwork files themselves, named so
//                            each one says which square it belongs to. This is
//                            what goes to the printer.
//
// Under /admin, so the same Basic Auth in middleware.js covers it. That matters
// more here than anywhere else on the site: this is every buyer's name, email,
// phone and address in one request.
export const dynamic = "force-dynamic";

const csvCell = (v) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  // Escape for Excel and for the fact that a buyer's address is free text and
  // will contain commas and newlines.
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const stamp = () => new Date().toISOString().slice(0, 10);

export async function GET(request) {
  const format = new URL(request.url).searchParams.get("format");

  try {
    const { rows } = await query(
      `select m_payment_id, buyer_name, buyer_email, buyer_phone, shirt_size,
              buyer_address, ship_overseas, details_completed_at,
              payment_method, placed_by,
              zone_id, col, "row", span, order_amount, paid_at, block_id,
              content, id
         from squares
        where status = 'paid'
        order by paid_at, "row", col`
    );

    if (format === "tar" || format === "zip") {
      // A tar written by hand, in about thirty lines, rather than pulling a
      // dependency into a live payment site for a once-a-campaign export. USTAR
      // is a 512-byte header per file and 512-byte padding, and it opens
      // natively on macOS, Linux and Windows 10 or later.
      const files = [];
      for (const r of rows) {
        const c = r.content;
        const where = `${r.zone_id}_c${r.col}r${r.row}`;
        const who = (r.buyer_name || "unknown").replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 40);
        if (c?.type === "image" && typeof c.src === "string") {
          const m = /^data:image\/([a-z0-9.+-]+);base64,(.*)$/i.exec(c.src);
          if (m) {
            const ext = m[1].toLowerCase().replace("jpeg", "jpg");
            files.push({ name: `${where}_${who}.${ext}`, body: Buffer.from(m[2], "base64"), r });
          }
        } else if (c?.type === "text") {
          files.push({ name: `${where}_${who}.txt`, body: Buffer.from(c.text || "", "utf8"), r });
        }
      }

      files.push({
        name: "MANIFEST.tsv",
        body: Buffer.from(
          "file\tbuyer\tsize\thandover\treference\n" +
            files
              .map((f) =>
                [
                  f.name,
                  f.r.buyer_name || "",
                  f.r.shirt_size || "",
                  f.r.ship_overseas ? "POST OVERSEAS" : "collect",
                  f.r.m_payment_id,
                ].join("\t")
              )
              .join("\n") + "\n",
          "utf8"
        ),
      });

      const pad512 = (n) => (n % 512 === 0 ? 0 : 512 - (n % 512));
      const chunks = [];
      for (const f of files) {
        const h = Buffer.alloc(512);
        h.write(f.name.slice(0, 99), 0, "utf8");            // name
        h.write("000644 \0", 100);                           // mode
        h.write("000000 \0", 108);                           // uid
        h.write("000000 \0", 116);                           // gid
        h.write(f.body.length.toString(8).padStart(11, "0") + " ", 124); // size
        h.write(Math.floor(Date.now() / 1000).toString(8).padStart(11, "0") + " ", 136); // mtime
        h.write("        ", 148);                            // checksum placeholder
        h.write("0", 156);                                   // type: regular file
        h.write("ustar\0" + "00", 257);                      // magic + version
        let sum = 0;
        for (const b of h) sum += b;
        h.write(sum.toString(8).padStart(6, "0") + "\0 ", 148);
        chunks.push(h, f.body, Buffer.alloc(pad512(f.body.length)));
      }
      chunks.push(Buffer.alloc(1024)); // two empty blocks end the archive

      const tar = Buffer.concat(chunks);
      console.log(`/admin/export: ${files.length - 1} artwork file(s), ${tar.length} bytes`);
      return new Response(tar, {
        headers: {
          "Content-Type": "application/x-tar",
          "Content-Disposition": `attachment; filename="legacy500-artwork-${stamp()}.tar"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // One row per square, not per order. A block of four is four things to
    // print, and whoever is at the printer needs all four lines.
    //
    // But the money belongs to the order, not to each of its squares. `amount`
    // used to carry the order total on every row, so a block of four put
    // R28,000 into a column that should have summed to the R7,000 actually
    // charged. Whoever adds up that column to reconcile against a Netcash
    // statement gets a figure that is wrong by more than the order is worth.
    //
    // `order_total` now appears once per order, on its first row, and stays
    // blank on the rest, so the column sums to exactly what was taken.
    // `squares_in_order` says why a row is blank, so a blank looks deliberate
    // rather than like missing data.
    //
    // Blank, not 0. A complimentary square is genuinely R0, so a zero on a
    // continuation row would be indistinguishable from a real free placement.
    const cellsPerOrder = new Map();
    rows.forEach((r) => {
      // A big 2x2 is one row covering four cells, so count the span, not the row.
      const cells = (r.span || 1) ** 2;
      cellsPerOrder.set(r.block_id, (cellsPerOrder.get(r.block_id) || 0) + cells);
    });
    // Keyed on block_id rather than position, because `order by paid_at` can
    // interleave two orders that settled in the same second.
    const totalWritten = new Set();

    const header = [
      "reference", "buyer_name", "email", "phone", "shirt_size",
      "handover", "address", "panel", "col", "row", "span",
      "artwork_type", "message", "order_total", "squares_in_order",
      // Cash and complimentary squares are entered from /admin rather than
      // bought, so the books do not reconcile against Netcash without these two.
      "payment_method", "placed_by", "paid_at",
    ];
    const lines = [header.join(",")];
    for (const r of rows) {
      const firstOfOrder = !totalWritten.has(r.block_id);
      if (firstOfOrder) totalWritten.add(r.block_id);
      lines.push([
        r.m_payment_id,
        r.buyer_name,
        r.buyer_email,
        r.buyer_phone,
        r.shirt_size,
        r.ship_overseas ? "POST OVERSEAS" : r.buyer_address ? "collect" : "no address yet",
        r.buyer_address,
        r.zone_id,
        r.col,
        r.row,
        r.span,
        r.content?.type || "",
        r.content?.type === "text" ? r.content.text : "",
        firstOfOrder ? r.order_amount : "",
        cellsPerOrder.get(r.block_id),
        r.payment_method,
        r.placed_by,
        r.paid_at ? new Date(r.paid_at).toISOString() : "",
      ].map(csvCell).join(","));
    }

    console.log(`/admin/export: ${rows.length} paid square(s) exported as CSV`);
    // BOM so Excel opens UTF-8 names and addresses correctly rather than
    // mangling anything with an accent in it.
    return new Response("﻿" + lines.join("\r\n") + "\r\n", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="legacy500-orders-${stamp()}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("/admin/export:", e.message);
    return new Response("Export failed: " + e.message, { status: 500 });
  }
}
