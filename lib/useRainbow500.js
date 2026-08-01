"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// All the pure grid/zone logic lives in lib/zones.js (no "use client", so
// it's importable from API routes too) - re-exported here so existing
// component imports of e.g. `fmt`/`spotColor` from this file keep working.
export * from "./zones";
import { getZone, occSetFrom, validFoot, activeColor, availableSpots, PRICE_PER_SPOT, BLOCK_PRICE, TOTAL_SQUARES } from "./zones";

// Phone photos can land north of 20MB; that would go straight into the
// `content` column as base64 and into every visitor's GET /api/squares
// response for as long as the square stays claimed. Resize (and, for JPEGs,
// re-encode at lower quality) client-side before it ever leaves the browser,
// shrinking further if it's still over budget. PNG keeps its format so a
// transparent logo stays transparent; only the pixel count and, as a last
// resort, JPEG quality are what shrink the payload.
import { fitArtworkToSquare, SOLID_WARN, OUTPUT_PX } from "./artfit";

// The doodle canvas is square because the thing being printed is square. It used to
// be 1.94:1 (full width by a fixed 180px), and because the square renders artwork
// with mask-size: contain, that shape could only ever occupy about 51% of the
// square's height. Half of what somebody paid for was unreachable.
//
// 900 backing pixels is well past the ~445 that 300 DPI needs for a 3.8cm square,
// which leaves headroom for cropping a small drawing back up to fill it.
const DOODLE_PX = OUTPUT_PX;

// A stroke this wide on a 900px canvas is about 0.6mm printed, in the worst
// case where the drawing already spans the full canvas and cropping cannot scale it
// up. The design note warns that thin lines close up at this size, so the pen is
// sized so they cannot be.
const DOODLE_STROKE = 15;

const MAX_LOGO_DIMENSION = 1400;
const MIN_LOGO_DIMENSION = 300;
const TARGET_LOGO_BYTES = 900_000; // data URL length, not decoded byte size

async function compressLogoFile(file) {
  const bitmap = await createImageBitmap(file);
  const isPng = file.type === "image/png";
  const mime = isPng ? "image/png" : "image/jpeg";
  let dim = Math.min(MAX_LOGO_DIMENSION, Math.max(bitmap.width, bitmap.height));
  let dataUrl;

  for (;;) {
    const scale = dim / Math.max(bitmap.width, bitmap.height);
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
    dataUrl = isPng ? canvas.toDataURL(mime) : canvas.toDataURL(mime, 0.85);
    if (dataUrl.length <= TARGET_LOGO_BYTES || dim <= MIN_LOGO_DIMENSION) break;
    dim = Math.round(dim * 0.8);
  }

  bitmap.close?.();
  return dataUrl;
}

// `reserved` (the cellKey -> entry map) now comes from useReservations(),
// which reads confirmed-paid squares from Supabase - this hook only owns
// the editor/UI state (mode, the open editor, the doodle canvas, toasts).
export default function useRainbow500(reserved) {
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

  const setCustomise = useCallback(() => {
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

  // Reopens the editor from state recovered after a cancelled or declined payment.
  // Straight to the details step, because that is where they were when they left,
  // and the artwork and both fields are already filled in.
  const resumeEditor = useCallback((saved) => {
    if (!saved) return;
    doodleDataRef.current = "";
    setEditor({ ...saved, step: "details" });
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

  // "Pick one for me". The primary path on a phone, where a single square is
  // about 16.5 x 9.5 CSS px against roughly 44px for a finger and most buyers do
  // not mind which square they get.
  //
  // Random rather than first-available, for two reasons. Two people tapping at
  // the same moment are far less likely to land on the same square, so fewer
  // people reach checkout only to be told it has gone. And artwork spreads
  // across the shirt as it fills instead of packing into the top-left corner,
  // which is what the finished kit should look like.
  const pickForMe = useCallback(() => {
    const spots = availableSpots(occ, spotSize);
    if (!spots.length) {
      pingToast(
        spotSize === 4 ? "No blocks of four left, try a single square" : "Every square is taken"
      );
      return;
    }
    const spot = spots[Math.floor(Math.random() * spots.length)];
    openEditor(spot.zoneId, spot.col, spot.row, spotSize);
  }, [occ, spotSize, openEditor, pingToast]);

  // Both forward actions refuse until the square has something on it, and both used to
  // refuse in total silence. Pressing a normal-looking button and having nothing happen,
  // with no reason given, is the worst outcome for somebody who is not confident here or
  // who does not read much English: there is nothing to work out what went wrong from.
  //
  // Read through editorRef rather than inside the setEditor updater, because a toast is a
  // side effect and an updater can run more than once.
  const NEEDS_ART = "Add a logo, a message or a drawing first.";

  const goReview = useCallback(() => {
    const cur = editorRef.current;
    if (cur && !cur.slots.some(Boolean)) {
      pingToast(NEEDS_ART);
      return;
    }
    setEditor((ed) => (ed && ed.slots.some(Boolean) ? { ...ed, step: "review" } : ed));
    setReviewLens(null);
  }, [pingToast]);
  const backToEdit = useCallback(() => {
    setEditor((ed) => (ed ? { ...ed, step: "edit" } : ed));
    setReviewLens(null);
  }, []);
  const goDetails = useCallback(() => {
    const cur = editorRef.current;
    if (cur && !cur.slots.some(Boolean)) {
      pingToast(NEEDS_ART);
      return;
    }
    setEditor((ed) => (ed && ed.slots.some(Boolean) ? { ...ed, step: "details" } : ed));
  }, [pingToast]);
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

  const handleLogoFile = useCallback(
    (f) => {
      if (!f) return;
      compressLogoFile(f)
        // Then reduce it to the stencil that actually gets printed and crop that to
        // fill the square. Without this, an image with no real transparency (any
        // JPEG, and any PNG saved on a white background) masked in as a completely
        // solid white block, and an image with built-in padding printed at a
        // fraction of the square. Both were verified on the live render.
        .then(async (src) => {
          const fit = await fitArtworkToSquare(src).catch(() => null);
          setSlot({
            type: "image",
            src: fit ? fit.src : src,
            logo: true,
            color: activeColor(editorRef.current),
          });
          if (fit && fit.coverage > SOLID_WARN) {
            pingToast("That will print as an almost solid block. A bold outline or simple shape works better.");
          }
        })
        .catch(() => {
          // Compression is a nice-to-have, not a gate - if the browser can't
          // decode it (e.g. an odd format createImageBitmap rejects), fall
          // back to using the file as-is rather than blocking the upload.
          const rd = new FileReader();
          rd.onload = () =>
            setSlot({ type: "image", src: rd.result, logo: true, color: activeColor(editorRef.current) });
          rd.readAsDataURL(f);
        });
    },
    [setSlot, pingToast]
  );

  const onLogoFile = useCallback(
    (e) => handleLogoFile(e.target.files && e.target.files[0]),
    [handleLogoFile]
  );

  const onLogoDrop = useCallback(
    (e) => {
      e.preventDefault();
      handleLogoFile(e.dataTransfer.files && e.dataTransfer.files[0]);
    },
    [handleLogoFile]
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
      // Square and fixed, not "whatever the element is wide by 180". The printed
      // area is square, so the drawing surface is too, and the backing store is
      // print resolution rather than screen resolution.
      el.width = DOODLE_PX;
      el.height = DOODLE_PX;
      const ctx = el.getContext("2d");
      doodleCtxRef.current = ctx;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = DOODLE_STROKE;
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
      // Crop to what was actually drawn, so a small mark in the middle of the canvas
      // becomes a bold mark filling the square rather than a small mark filling a
      // fraction of it. This runs after every stroke, which means the preview always
      // shows the real result: the drawing appears to grow into the square as you
      // add to it, which is the clearest way to say "use the whole space".
      //
      // seq guards the ordering. Two quick strokes start two async fits, and without
      // this the slower first one could land after the faster second and show stale
      // artwork.
      let seq = 0;
      const end = async () => {
        if (!drawing) return;
        drawing = false;
        const mine = ++seq;
        const raw = el.toDataURL("image/png");
        doodleDataRef.current = raw;
        // ok distinguishes "the fit ran and found nothing drawn" from "the fit threw".
        // A tap with no drag leaves the canvas empty, and that should not become a
        // slot holding a blank image the way it used to.
        const res = await fitArtworkToSquare(raw).then((r) => ({ ok: true, r })).catch(() => ({ ok: false }));
        if (mine !== seq) return;
        if (res.ok && !res.r) return;
        setSlot({
          type: "image",
          src: res.r ? res.r.src : raw,
          doodle: true,
          color: activeColor(editorRef.current),
        });
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
    spotSize,
    editor,
    hover,
    toast,
    reviewLens,
    occ,
    price: PRICE_PER_SPOT,
    blockPrice: BLOCK_PRICE,
    total: TOTAL_SQUARES,
    setCustomise,
    setSize1,
    setSize4,
    onHover,
    onLeave,
    onPick,
    pickForMe,
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
    onLogoDrop,
    onMsgInput,
    attachCanvas,
    clearDoodle,
    resumeEditor,
    pingToast,
  };
}
