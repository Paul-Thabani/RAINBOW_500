"use client";

import { useState } from "react";
import { fmt, spotColor, pendingEntries, getZone, zonesFor } from "../lib/useRainbow500";
import { RegionOverlay } from "./ShirtPanel";
import DoodleCanvas from "./DoodleCanvas";
import { RAINBOW_GRADIENT } from "../lib/brand";

const FRONT_ZONES = zonesFor("front");
const BACK_ZONES = zonesFor("back");

function segMode(active) {
  return {
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 800,
    fontSize: 13,
    flex: 1,
    border: "none",
    padding: 9,
    borderRadius: 9,
    background: active ? "#fff" : "transparent",
    color: active ? "#12151c" : "#9aa1ac",
    boxShadow: active ? "0 1px 3px rgba(0,0,0,.12)" : "none",
  };
}

function tabStyle(active) {
  return {
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 800,
    fontSize: 14,
    flex: 1,
    border: "none",
    padding: 10,
    borderRadius: "12px 12px 0 0",
    background: active ? "#f0f1f4" : "transparent",
    color: active ? "#12151c" : "#9aa1ac",
    borderBottom: active ? "3px solid #12151c" : "3px solid transparent",
  };
}

function PreviewTile({ content, big, color }) {
  const box = {
    background: color || "#64748b",
    border: "1px solid rgba(0,0,0,.08)",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    aspectRatio: "1",
    containerType: "inline-size",
  };
  const shadow = "drop-shadow(0 1px 2px rgba(0,0,0,.4))";
  if (content && content.type === "image") {
    return (
      <div style={box}>
        <div
          style={{
            width: "84%",
            height: "84%",
            background: "#fff",
            filter: shadow,
            WebkitMaskImage: `url(${content.src})`,
            maskImage: `url(${content.src})`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
        />
      </div>
    );
  }
  if (content && content.type === "text") {
    return (
      <div style={box}>
        <div
          style={{
            fontFamily: "'Permanent Marker',cursive",
            color: "#fff",
            textShadow: "0 1px 2px rgba(0,0,0,.45)",
            fontSize: big ? "16cqw" : "22cqw",
            textAlign: "center",
            lineHeight: 1.05,
            padding: 4,
          }}
        >
          {content.text}
        </div>
      </div>
    );
  }
  return (
    <div style={{ ...box, background: "#fff", border: "1.5px dashed #cfd3da", color: "#9aa1ac", fontSize: 12, fontWeight: 700 }}>
      Empty
    </div>
  );
}

function PreviewGrid({ ed }) {
  const zone = getZone(ed.zoneId);
  if (ed.size === 1 || ed.big) {
    return (
      <div style={{ maxWidth: ed.big ? "220px" : "120px" }}>
        <PreviewTile content={ed.slots[0]} big={ed.big} color={spotColor(zone, ed.col, ed.row)} />
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, maxWidth: "220px" }}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            position: "relative",
            outline: ed.active === i ? "2px solid #5f4ea1" : "none",
            outlineOffset: 1,
            borderRadius: 10,
          }}
        >
          <PreviewTile
            content={ed.slots[i]}
            big={false}
            color={spotColor(zone, ed.col + [0, 1, 0, 1][i], ed.row + [0, 0, 1, 1][i])}
          />
        </div>
      ))}
    </div>
  );
}

function ReviewRow({ editor, reserved, hi }) {
  const extra = pendingEntries(editor);
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
        <img
          src="/assets/kit-customise.png"
          alt=""
          draggable={false}
          style={{ display: "block", width: "100%", height: "auto", userSelect: "none", pointerEvents: "none" }}
        />
        {FRONT_ZONES.map((zone) => (
          <RegionOverlay key={zone.id} zone={zone} reserved={reserved} extra={extra} hi={hi} />
        ))}
      </div>
      <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
        <img
          src="/assets/kit-back.png"
          alt=""
          draggable={false}
          style={{ display: "block", width: "100%", height: "auto", userSelect: "none", pointerEvents: "none" }}
        />
        {BACK_ZONES.map((zone) => (
          <RegionOverlay key={zone.id} zone={zone} reserved={reserved} extra={extra} hi={hi} />
        ))}
      </div>
    </div>
  );
}

function ReviewKit({ editor, reserved, reviewLens, onReviewMove, onReviewLeave }) {
  const ZOOM = 3.2;
  const LENS = 180;
  const hi = { zoneId: editor.zoneId, col: editor.col, row: editor.row, span: editor.size === 4 ? 2 : 1 };

  return (
    <div
      onMouseMove={onReviewMove}
      onMouseLeave={onReviewLeave}
      style={{
        position: "relative",
        width: "100%",
        borderRadius: 14,
        overflow: "hidden",
        background: "#10203a",
        border: "1px solid #24405f",
        cursor: "crosshair",
      }}
    >
      <ReviewRow editor={editor} reserved={reserved} hi={hi} />
      {reviewLens && (
        <div
          style={{
            position: "absolute",
            width: LENS,
            height: LENS,
            left: reviewLens.px - LENS / 2,
            top: reviewLens.py - LENS / 2,
            borderRadius: "50%",
            overflow: "hidden",
            border: "3px solid #fff",
            boxShadow: "0 12px 34px rgba(0,0,0,.4), 0 0 0 1.5px rgba(0,0,0,.12)",
            pointerEvents: "none",
            zIndex: 30,
            background: "#10203a",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: reviewLens.w * ZOOM,
              height: reviewLens.h * ZOOM,
              left: -reviewLens.fx * reviewLens.w * ZOOM + LENS / 2,
              top: -reviewLens.fy * reviewLens.h * ZOOM + LENS / 2,
            }}
          >
            <ReviewRow editor={editor} reserved={reserved} hi={hi} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditorModal({
  editor,
  reserved,
  reviewLens,
  price,
  blockPrice,
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
  goReview,
  backToEdit,
  goDetails,
  backToReview,
  onEmailInput,
  onPhoneInput,
  onReviewMove,
  onReviewLeave,
  checkout,
  isCheckingOut,
}) {
  const [logoDragOver, setLogoDragOver] = useState(false);
  const handleLogoDragOver = (e) => {
    e.preventDefault();
    setLogoDragOver(true);
  };
  const handleLogoDragLeave = () => setLogoDragOver(false);
  const handleLogoDrop = (e) => {
    setLogoDragOver(false);
    onLogoDrop(e);
  };

  const ed = editor;
  const isEditStep = (ed.step || "edit") === "edit";
  const isReviewStep = ed.step === "review";
  const isDetailsStep = ed.step === "details";
  const isBlock = ed.size === 4;
  const isFour = ed.size === 4 && !ed.big;
  const hasContent = ed.slots.some(Boolean);
  const activeContent = ed.slots[ed.active];
  const canProceed = hasContent && !isCheckingOut;
  const emailValid = /^\S+@\S+\.\S+$/.test((ed.email || "").trim());
  const phoneValid = (ed.phone || "").replace(/[^0-9]/g, "").length >= 7;
  const canSubmit = emailValid && phoneValid && !isCheckingOut;

  const reserveLabel = ed.size === 4 ? `Reserve a block of 4 · R${fmt(blockPrice)}` : `Reserve a square · R${fmt(price)}`;
  const editorTitle = isDetailsStep ? "Your details" : isReviewStep ? "How it looks" : "Make it yours";
  const previewHeading = isReviewStep ? "Your design on the shirt · hover to zoom in" : "Preview on shirt";
  const securePriceLabel = ed.size === 4 ? fmt(blockPrice) : fmt(price);
  const continueLabel = "Continue";
  const proceedLabel = isCheckingOut ? "Redirecting to payment..." : `Proceed to payment · R${securePriceLabel}`;
  const handleContinue = () => {
    if (canProceed) goDetails();
  };
  const handleProceed = () => {
    if (canSubmit) checkout(ed);
  };

  const secureStyle = {
    cursor: canProceed ? "pointer" : "default",
    fontFamily: "inherit",
    fontWeight: 800,
    fontSize: 15,
    color: "#fff",
    border: "none",
    padding: "11px 20px",
    borderRadius: 999,
    background: canProceed ? RAINBOW_GRADIENT : "#c9ccd2",
    opacity: hasContent ? 1 : 0.8,
  };
  const proceedStyle = {
    cursor: canSubmit ? "pointer" : "default",
    fontFamily: "inherit",
    fontWeight: 800,
    fontSize: 15,
    color: "#fff",
    border: "none",
    padding: "11px 20px",
    borderRadius: 999,
    background: canSubmit ? RAINBOW_GRADIENT : "#c9ccd2",
    opacity: isCheckingOut ? 0.8 : 1,
  };
  const inputStyle = {
    width: "100%",
    border: "1.5px solid #e6e8ec",
    borderRadius: 12,
    padding: "12px 14px",
    fontFamily: "inherit",
    fontSize: 15,
    color: "#12151c",
  };

  return (
    <div
      onClick={closeEditor}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,12,18,.55)",
        backdropFilter: "blur(3px)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={stop}
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "92vh",
          overflow: "auto",
          background: "#fff",
          borderRadius: 22,
          boxShadow: "0 30px 80px rgba(0,0,0,.4)",
          animation: "floatIn .25s ease both",
          color: "#12151c",
        }}
      >
        <div style={{ padding: "20px 22px", borderBottom: "1px solid #eceef1", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#6b7280", fontWeight: 800 }}>
              {reserveLabel}
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, marginTop: 2 }}>{editorTitle}</div>
          </div>
          <button
            type="button"
            onClick={closeEditor}
            style={{ cursor: "pointer", border: "none", background: "#f0f1f4", width: 34, height: 34, borderRadius: "50%", fontSize: 18, color: "#374151", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {isEditStep && (
          <>
            {isBlock && (
              <div style={{ padding: "16px 22px 0" }}>
                <div style={{ display: "flex", background: "#f0f1f4", border: "1px solid #e6e8ec", borderRadius: 12, padding: 4 }}>
                  <button type="button" onClick={setBigFalse} style={segMode(!ed.big)}>
                    Four separate pieces
                  </button>
                  <button type="button" onClick={setBigTrue} style={segMode(ed.big)}>
                    One big piece (4×)
                  </button>
                </div>
              </div>
            )}

            {isFour && (
              <div style={{ padding: "16px 22px 0" }}>
                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700, marginBottom: 8 }}>
                  Fill each of the four pieces (leave any blank if you like):
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveSlot(i)}
                      style={{
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontWeight: 800,
                        fontSize: 12,
                        border: ed.active === i ? "2px solid #12151c" : "1.5px solid #e6e8ec",
                        background: ed.active === i ? "#f0f1f4" : "#fff",
                        color: "#12151c",
                        padding: "8px 10px",
                        borderRadius: 10,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      Piece {i + 1}
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: ed.slots[i] ? "#2cae4a" : "#cfd3da",
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 6, padding: "16px 22px 0" }}>
              <button type="button" onClick={tabLogoClick} style={tabStyle(ed.tab === "logo")}>
                Logo
              </button>
              <button type="button" onClick={tabMsgClick} style={tabStyle(ed.tab === "message")}>
                Message
              </button>
              <button type="button" onClick={tabDoodleClick} style={tabStyle(ed.tab === "doodle")}>
                Doodle
              </button>
            </div>

            <div style={{ padding: "18px 22px 6px" }}>
              {ed.tab === "logo" && (
                <label
                  onDragOver={handleLogoDragOver}
                  onDragLeave={handleLogoDragLeave}
                  onDrop={handleLogoDrop}
                  style={{
                    display: "block",
                    border: `2px dashed ${logoDragOver ? "#5f4ea1" : "#cfd3da"}`,
                    background: logoDragOver ? "#f5f3fb" : "transparent",
                    borderRadius: 16,
                    padding: 24,
                    textAlign: "center",
                    cursor: "pointer",
                  }}
                >
                  {/* The copy promises PNG or JPG, so accept should say the
                      same. image/* let SVG, GIF and HEIC through, none of which
                      the compressor or the printer handles predictably. */}
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={onLogoFile}
                    style={{ display: "none" }}
                  />
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#12151c" }}>Upload your logo</div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                    PNG or JPG, or drag a file in. A transparent PNG sits best on the rainbow kit.
                  </div>
                </label>
              )}
              {ed.tab === "message" && (
                <div>
                  <textarea
                    value={activeContent && activeContent.type === "text" ? activeContent.text : ""}
                    onChange={onMsgInput}
                    maxLength={42}
                    placeholder="e.g. Go Bay! · For the boys · Play with heart"
                    style={{
                      width: "100%",
                      height: 74,
                      resize: "none",
                      border: "1.5px solid #e6e8ec",
                      borderRadius: 14,
                      padding: "12px 14px",
                      fontFamily: "inherit",
                      fontSize: 15,
                      color: "#12151c",
                    }}
                  />
                  <div style={{ fontSize: 12, color: "#6b7280", margin: "8px 2px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", border: "1px solid #d4d7dd", flex: "none" }} />
                    Up to 42 characters. Printed in white on the rainbow kit.
                  </div>
                </div>
              )}
              {ed.tab === "doodle" && <DoodleCanvas attachCanvas={attachCanvas} clearDoodle={clearDoodle} />}
            </div>
          </>
        )}

        {isDetailsStep ? (
          <div style={{ padding: "18px 22px 6px" }}>
            <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 18 }}>
              We&apos;ll use these to send your receipt and reach you about your square.
            </div>
            {/* htmlFor/id so the visible text is genuinely the field's
                accessible name rather than just sitting above it, and
                autoComplete so a phone offers to fill both. On an audience that
                is 82% mobile, autofill is free conversion. */}
            <div style={{ marginBottom: 16 }}>
              <label
                htmlFor="buyer-email"
                style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#12151c", marginBottom: 6 }}
              >
                Email address
              </label>
              <input
                id="buyer-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={ed.email || ""}
                onChange={onEmailInput}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>
            <div>
              <label
                htmlFor="buyer-phone"
                style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#12151c", marginBottom: 6 }}
              >
                Phone number
              </label>
              <input
                id="buyer-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={ed.phone || ""}
                onChange={onPhoneInput}
                placeholder="e.g. 082 123 4567"
                style={inputStyle}
              />
            </div>
          </div>
        ) : (
          <div style={{ padding: "8px 22px 18px" }}>
            <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#6b7280", fontWeight: 800, marginBottom: 8 }}>
              {previewHeading}
            </div>
            {isReviewStep ? (
              <ReviewKit editor={ed} reserved={reserved} reviewLens={reviewLens} onReviewMove={onReviewMove} onReviewLeave={onReviewLeave} />
            ) : (
              <PreviewGrid ed={ed} />
            )}
          </div>
        )}

        <div style={{ padding: "16px 22px", borderTop: "1px solid #eceef1", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>Funds kit, boots, nutrition &amp; more.</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {isEditStep && (
              <>
                <button
                  type="button"
                  onClick={closeEditor}
                  style={{ cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 15, color: "#374151", background: "#fff", border: "1.5px solid #e6e8ec", padding: "11px 18px", borderRadius: 999 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={goReview}
                  style={{ cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 15, color: "#374151", background: "#fff", border: "1.5px solid #e6e8ec", padding: "11px 18px", borderRadius: 999 }}
                >
                  See how it looks
                </button>
                <button type="button" onClick={handleContinue} disabled={isCheckingOut} style={secureStyle}>
                  {continueLabel}
                </button>
              </>
            )}
            {isReviewStep && (
              <>
                <button
                  type="button"
                  onClick={backToEdit}
                  style={{ cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 15, color: "#374151", background: "#fff", border: "1.5px solid #e6e8ec", padding: "11px 18px", borderRadius: 999 }}
                >
                  Edit
                </button>
                <button type="button" onClick={handleContinue} disabled={isCheckingOut} style={secureStyle}>
                  {continueLabel}
                </button>
              </>
            )}
            {isDetailsStep && (
              <>
                <button
                  type="button"
                  onClick={backToReview}
                  style={{ cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 15, color: "#374151", background: "#fff", border: "1.5px solid #e6e8ec", padding: "11px 18px", borderRadius: 999 }}
                >
                  Back
                </button>
                <button type="button" onClick={handleProceed} disabled={!canSubmit} style={proceedStyle}>
                  {proceedLabel}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
