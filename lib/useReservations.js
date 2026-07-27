"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "./supabaseClient";
import { cellKey } from "./zones";

const POLL_MS = 25000;

// Reservation state now lives in Supabase, not the browser: a square only
// shows here once its payment has actually been confirmed (see
// app/api/payfast/notify/route.js). This hook fetches the public
// `paid_squares` view, polls it periodically so every visitor sees the same
// shirt, and exposes `checkout()` to kick off a real Payfast payment.
export default function useReservations() {
  const [reserved, setReserved] = useState({});
  const [raised, setRaised] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [redirectNotice, setRedirectNotice] = useState("");

  const fetchReserved = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from("paid_squares").select("*");
      if (error) throw error;
      const map = {};
      const seenBlocks = new Map();
      (data || []).forEach((r) => {
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
        if (!seenBlocks.has(r.block_id)) seenBlocks.set(r.block_id, Number(r.order_amount) || 0);
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
      setRedirectNotice("Payment received! Confirming your square now ♥");
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

  return {
    reserved,
    claimed,
    raised,
    loaded,
    isCheckingOut,
    checkoutError,
    redirectNotice,
    checkout,
    refetch: fetchReserved,
  };
}
