"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// All the pure grid/zone logic lives in lib/zones.js (no "use client", so
// it's importable from API routes too) - re-exported here so existing
// component imports of e.g. `fmt`/`spotColor` from this file keep working.
export * from "./zones";
import { getZone, occSetFrom, validFoot, activeColor, PRICE_PER_SPOT, BLOCK_PRICE, TOTAL_SQUARES } from "./zones";

// `reserved` (the cellKey -> entry map) now comes from useReservations(),
// which reads confirmed-paid squares from Supabase - this hook only owns
// the editor/UI state (mode, the open editor, the doodle canvas, toasts).
export default function useRainbow500(reserved) {
  const [mode, setMode] = useState("preview");
  const [spotSize, setSpotSize] = useState(1);
  const [editor, setEditor] = useState(null);
  const [hover, setHover] = useState(null);
  const [toast, setToast] = useState("");
  const [reviewLens, setReviewLens] = useState(null);

  const editorRef = useRef(editor);
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  const toastTimer = useRef(null);
  const doodleCanvasRef = useRef(null);
  const doodleCtxRef = useRef(null);
  const doodleDataRef = useRef("");

  const occ = useMemo(() => occSetFrom(reserved), [reserved]);

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (el)
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - 20,
        behavior: "smooth",
      });
  }, []);

  const goTracker = useCallback(() => scrollTo("tracker"), [scrollTo]);
  const setPreview = useCallback(() => {
    setMode("preview");
    setEditor(null);
    setHover(null);
  }, []);
  const setCustomise = useCallback(() => {
    setMode("customise");
    setEditor(null);
    scrollTo("kit");
  }, [scrollTo]);
  const setSize1 = useCallback(() => {
    setSpotSize(1);
    setHover(null);
  }, []);
  const setSize4 = useCallback(() => {
    setSpotSize(4);
    setHover(null);
  }, []);

  const pingToast = useCallback((msg) => {
    if (msg) setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2800);
  }, []);

  const anchorFrom = useCallback((e, size, zone) => {
    const sp = size === 4 ? 2 : 1;
    const rect = e.currentTarget.getBoundingClientRect();
    let c = Math.floor(((e.clientX - rect.left) / rect.width) * zone.cols);
    let r = Math.floor(((e.clientY - rect.top) / rect.height) * zone.rows);
    c = Math.max(0, Math.min(c, zone.cols - sp));
    r = Math.max(0, Math.min(r, zone.rows - sp));
    return { c, r };
  }, []);

  const onHover = useCallback(
    (zoneId, e) => {
      const zone = getZone(zoneId);
      if (!zone) return;
      const size = zone.cols < 2 || zone.rows < 2 ? 1 : spotSize;
      const { c, r } = anchorFrom(e, size, zone);
      const valid = validFoot(occ, zone, c, r, size);
      setHover((h) => {
        if (!h || h.zoneId !== zoneId || h.col !== c || h.row !== r || h.valid !== valid) {
          return { zoneId, col: c, row: r, valid, span: size === 4 ? 2 : 1 };
        }
        return h;
      });
    },
    [spotSize, occ, anchorFrom]
  );

  const onLeave = useCallback(() => setHover(null), []);

  const openEditor = useCallback((zoneId, col, row, size) => {
    doodleDataRef.current = "";
    const slots = size === 4 ? [null, null, null, null] : [null];
    setEditor({
      zoneId,
      col,
      row,
      size,
      big: false,
      step: "edit",
      tab: "logo",
      active: 0,
      slots,
      email: "",
      phone: "",
    });
    setHover(null);
  }, []);

  const onPick = useCallback(
    (zoneId, e) => {
      const zone = getZone(zoneId);
      if (!zone) return;
      // a zone smaller than a 2x2 block (e.g. the small sleeve grids) can
      // only ever take single squares, regardless of the global size toggle
      const size = zone.cols < 2 || zone.rows < 2 ? 1 : spotSize;
      const { c, r } = anchorFrom(e, size, zone);
      if (!validFoot(occ, zone, c, r, size)) {
        pingToast("That spot's taken, try another");
        return;
      }
      openEditor(zoneId, c, r, size);
    },
    [spotSize, occ, anchorFrom, pingToast, openEditor]
  );

  const goReview = useCallback(() => {
    setEditor((ed) => (ed && ed.slots.some(Boolean) ? { ...ed, step: "review" } : ed));
    setReviewLens(null);
  }, []);
  const backToEdit = useCallback(() => {
    setEditor((ed) => (ed ? { ...ed, step: "edit" } : ed));
    setReviewLens(null);
  }, []);
  const goDetails = useCallback(() => {
    setEditor((ed) => (ed && ed.slots.some(Boolean) ? { ...ed, step: "details" } : ed));
  }, []);
  const backToReview = useCallback(() => {
    setEditor((ed) => (ed ? { ...ed, step: "review" } : ed));
  }, []);
  const onEmailInput = useCallback((e) => {
    const v = e.target.value;
    setEditor((ed) => (ed ? { ...ed, email: v } : ed));
  }, []);
  const onPhoneInput = useCallback((e) => {
    const v = e.target.value;
    setEditor((ed) => (ed ? { ...ed, phone: v } : ed));
  }, []);
  const onReviewMove = useCallback((e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    setReviewLens({ fx: px / r.width, fy: py / r.height, px, py, w: r.width, h: r.height });
  }, []);
  const onReviewLeave = useCallback(() => setReviewLens(null), []);
  const closeEditor = useCallback(() => setEditor(null), []);
  const stop = useCallback((e) => e.stopPropagation(), []);
  const setBigTrue = useCallback(() => setEditor((ed) => (ed ? { ...ed, big: true, active: 0 } : ed)), []);
  const setBigFalse = useCallback(() => setEditor((ed) => (ed ? { ...ed, big: false, active: 0 } : ed)), []);
  const setActiveSlot = useCallback((i) => setEditor((ed) => (ed ? { ...ed, active: i } : ed)), []);
  const setTab = useCallback((t) => setEditor((ed) => (ed ? { ...ed, tab: t } : ed)), []);
  const tabLogoClick = useCallback(() => setTab("logo"), [setTab]);
  const tabMsgClick = useCallback(() => setTab("message"), [setTab]);
  const tabDoodleClick = useCallback(() => setTab("doodle"), [setTab]);

  const setSlot = useCallback((content) => {
    setEditor((ed) => {
      if (!ed) return ed;
      const slots = ed.slots.slice();
      slots[ed.active] = content;
      return { ...ed, slots };
    });
  }, []);

  const onLogoFile = useCallback(
    (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () =>
        setSlot({ type: "image", src: rd.result, logo: true, color: activeColor(editorRef.current) });
      rd.readAsDataURL(f);
    },
    [setSlot]
  );

  const onMsgInput = useCallback(
    (e) => {
      const v = e.target.value;
      setSlot(v ? { type: "text", text: v, color: activeColor(editorRef.current) } : null);
    },
    [setSlot]
  );

  const attachCanvas = useCallback(
    (el) => {
      if (!el || el.__wired) {
        if (el) doodleCanvasRef.current = el;
        return;
      }
      el.__wired = true;
      doodleCanvasRef.current = el;
      const rect = el.getBoundingClientRect();
      el.width = Math.max(320, Math.round(rect.width || 420));
      el.height = 180;
      const ctx = el.getContext("2d");
      doodleCtxRef.current = ctx;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 4;
      let drawing = false;
      const pos = (e) => {
        const r = el.getBoundingClientRect();
        return [((e.clientX - r.left) * el.width) / r.width, ((e.clientY - r.top) * el.height) / r.height];
      };
      el.addEventListener("pointerdown", (e) => {
        drawing = true;
        try {
          el.setPointerCapture(e.pointerId);
        } catch (x) {}
        ctx.strokeStyle = "#1f2937";
        const [x, y] = pos(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
      });
      el.addEventListener("pointermove", (e) => {
        if (!drawing) return;
        const [x, y] = pos(e);
        ctx.lineTo(x, y);
        ctx.stroke();
      });
      const end = () => {
        if (!drawing) return;
        drawing = false;
        doodleDataRef.current = el.toDataURL("image/png");
        setSlot({ type: "image", src: doodleDataRef.current, doodle: true, color: activeColor(editorRef.current) });
      };
      el.addEventListener("pointerup", end);
      el.addEventListener("pointerleave", end);
    },
    [setSlot]
  );

  const clearDoodle = useCallback(() => {
    if (doodleCtxRef.current && doodleCanvasRef.current) {
      doodleCtxRef.current.clearRect(0, 0, doodleCanvasRef.current.width, doodleCanvasRef.current.height);
    }
    doodleDataRef.current = "";
    setSlot(null);
  }, [setSlot]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  return {
    mode,
    spotSize,
    editor,
    hover,
    toast,
    reviewLens,
    occ,
    price: PRICE_PER_SPOT,
    blockPrice: BLOCK_PRICE,
    total: TOTAL_SQUARES,
    setPreview,
    setCustomise,
    goTracker,
    setSize1,
    setSize4,
    onHover,
    onLeave,
    onPick,
    openEditor,
    goReview,
    backToEdit,
    goDetails,
    backToReview,
    onEmailInput,
    onPhoneInput,
    onReviewMove,
    onReviewLeave,
    closeEditor,
    stop,
    setBigTrue,
    setBigFalse,
    setActiveSlot,
    tabLogoClick,
    tabMsgClick,
    tabDoodleClick,
    onLogoFile,
    onMsgInput,
    attachCanvas,
    clearDoodle,
    pingToast,
  };
}
