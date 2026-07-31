"use client";

import { useCallback, useEffect, useState } from "react";
import { cellKey } from "./zones";

const POLL_MS = 25000;

// Reservation state lives in the database, not the browser: a square shows
// here once it's paid, or as soon as someone else has started checking out
// for it (see the `claimed_squares` view - this is what stops two people
// both buying the same square). This hook polls GET /api/squares periodically
// so every visitor sees the same shirt, and exposes `checkout()` to kick off a
// real Netcash payment.
//
// Note the artwork of an in-progress square is deliberately not served: the
// view withholds it until a row is paid, so those cells render as a plain
// taken block.
//
// The poll carries no images. It used to inline every paid square's artwork as
// a base64 data URL, so an endpoint that is re-fetched every 25 seconds and on
// every window focus was re-sending hundreds of KB that had not changed since
// the square was sold. Each square now points at its own thumbnail URL, which
// the browser caches for a year, so the artwork is fetched once per visitor
// instead of 144 times an hour per tab.
export default function useReservations() {
  const [reserved, setReserved] = useState({});
  const [raised, setRaised] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [redirectNotice, setRedirectNotice] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const fetchReserved = useCallback(async () => {
    try {
      const res = await fetch("/api/squares", { cache: "no-store" });
      if (!res.ok) throw new Error("request failed with " + res.status);
      const data = await res.json();
      const map = {};
      const seenBlocks = new Map();
      (data.squares || []).forEach((r) => {
        map[cellKey(r.zone_id, r.col, r.row)] = {
          zoneId: r.zone_id,
          col: r.col,
          row: r.row,
          span: r.span,
          big: r.big,
          // Everything about the artwork except the artwork: type, message
          // text, colour. Same shape the editor's own in-progress entries use,
          // minus `src`, so ShirtPanel renders both from one code path.
          content: r.art,
          // Where the bytes went. Null for a text square, and null for a paid
          // square whose thumbnail has not been generated yet (a row that
          // predates scripts/backfill-thumbnails.mjs, or artwork sharp could
          // not read); ShirtPanel falls back to a plain claimed block.
          artUrl: r.has_art ? `/api/square/${r.id}/thumb` : null,
          fill: r.fill,
          blockId: r.block_id,
          // Needed downstream to tell a confirmed square from one that is
          // merely mid-checkout. Both belong in `reserved`, because both block
          // a second buyer, but only one of them is a claim.
          status: r.status,
        };
        // Only confirmed payments count toward the "raised" total - a
        // square that's merely mid-checkout isn't money in the bank yet.
        if (r.status === "paid" && !seenBlocks.has(r.block_id)) {
          seenBlocks.set(r.block_id, Number(r.order_amount) || 0);
        }
      });
      setReserved(map);
      setRaised([...seenBlocks.values()].reduce((sum, v) => sum + v, 0));
    } catch (e) {
      console.error("Failed to load reservations:", e.message);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchReserved();
    const interval = setInterval(fetchReserved, POLL_MS);
    const onFocus = () => fetchReserved();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchReserved]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("checkout");
    if (status === "success") {
      setPaymentSuccess(true);
      fetchReserved();
    } else if (status === "cancelled") {
      setRedirectNotice("Payment cancelled, your spot's still open");
    }
    if (status) {
      params.delete("checkout");
      params.delete("ref");
      const qs = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? "?" + qs : ""));
    }
  }, [fetchReserved]);

  const checkout = useCallback(async (ed) => {
    setCheckoutError("");
    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zoneId: ed.zoneId,
          col: ed.col,
          row: ed.row,
          size: ed.size,
          big: ed.big,
          slots: ed.slots,
          email: ed.email,
          phone: ed.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error || "Something went wrong, please try again");
        setIsCheckingOut(false);
        return false;
      }
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.url;
      form.target = "_top"; // Netcash requires this - never submit inside an iframe
      Object.entries(data.fields).forEach(([name, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
      return true;
    } catch (e) {
      setCheckoutError("Couldn't reach the server, please try again");
      setIsCheckingOut(false);
      return false;
    }
  }, []);

  // Only paid squares are "claimed", for the same reason `raised` only counts
  // paid orders. Counting reservations here made the two disagree in public:
  // the tracker read "4 of 500 squares claimed" beside "R6,000 raised", and
  // anyone could inflate the number by opening a checkout and walking away.
  //
  // `reserved` still holds the pending ones. It has to, since that is what
  // stops a second buyer taking a square someone is mid-checkout for. The two
  // questions are just different: what is unavailable, and what is sold.
  const claimed = Object.values(reserved).reduce(
    (sum, e) => (e.status === "paid" ? sum + (e.span || 1) * (e.span || 1) : sum),
    0
  );

  const dismissPaymentSuccess = useCallback(() => setPaymentSuccess(false), []);

  return {
    reserved,
    claimed,
    raised,
    loaded,
    isCheckingOut,
    checkoutError,
    redirectNotice,
    paymentSuccess,
    dismissPaymentSuccess,
    checkout,
    refetch: fetchReserved,
  };
}
