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
// view nulls `content` until a row is paid, so those cells render as a plain
// taken block.
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
          content: r.content,
          fill: r.fill,
          blockId: r.block_id,
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

  const claimed = Object.values(reserved).reduce((sum, e) => sum + (e.span || 1) * (e.span || 1), 0);

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
