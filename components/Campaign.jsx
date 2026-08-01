"use client";

import { useEffect } from "react";
import useRainbow500, { fmt, getZone, occSetFrom, validFoot, cellKey } from "../lib/useRainbow500";
import useReservations from "../lib/useReservations";
import Header from "./Header";
import Hero from "./Hero";
import Belief from "./Belief";
import Idea from "./Idea";
import Impact from "./Impact";
import Tracker from "./Tracker";
import HowItWorks from "./HowItWorks";
import KitSection from "./KitSection";
import EditorModal from "./EditorModal";
import Pricing from "./Pricing";
import FabricCTA from "./FabricCTA";
import ReachStats from "./ReachStats";
import FinalAsk from "./FinalAsk";
import Footer from "./Footer";
import Toast from "./Toast";
import PaymentSuccessModal from "./PaymentSuccessModal";

export default function Campaign() {
  const reservations = useReservations();
  const r = useRainbow500(reservations.reserved);
  const goalLabel = "R" + fmt(r.price * r.total);

  useEffect(() => {
    if (reservations.redirectNotice) r.pingToast(reservations.redirectNotice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservations.redirectNotice]);

  // Coming back from a cancelled or declined payment. Waits for the board to load
  // first, because whether the original square is still free is the one thing that
  // decides what to offer, and cleared immediately so it only fires once.
  useEffect(() => {
    const saved = reservations.resumable;
    if (!saved || !reservations.loaded) return;
    reservations.clearResumable();
    const zone = getZone(saved.zoneId);
    const free = zone && validFoot(occSetFrom(reservations.reserved), zone, saved.col, saved.row, saved.size);
    // "Occupied" is not the same as "somebody else got it". If the cell is held by a
    // pending row it is almost certainly this buyer's own reservation, either because
    // the release has not landed yet or because they came back without Netcash's
    // cancel link running. Telling them a stranger took their square in that case is
    // both wrong and the most discouraging thing the page could say.
    const holder = reservations.reserved[cellKey(saved.zoneId, saved.col, saved.row)];
    const soldToSomeoneElse = !free && holder && holder.status === "paid";
    if (soldToSomeoneElse) {
      r.pingToast("That square sold while you were paying. Pick another one and your design is still here.");
      return;
    }
    r.resumeEditor(saved);
    r.pingToast("Payment did not go through. Your square and design are still here.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservations.resumable, reservations.loaded, reservations.reserved]);

  useEffect(() => {
    if (reservations.checkoutError) r.pingToast(reservations.checkoutError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservations.checkoutError]);

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 22px" }}>
      <Header onJoin={r.setCustomise} />

      <Hero
        onJoin={r.setCustomise}
        goalLabel={goalLabel}
        claimed={reservations.claimed}
        total={r.total}
        price={r.price}
      />

      <KitSection
        spotSize={r.spotSize}
        setSize1={r.setSize1}
        setSize4={r.setSize4}
        price={r.price}
        blockPrice={r.blockPrice}
        reserved={reservations.reserved}
        hover={r.hover}
        onHover={r.onHover}
        onLeave={r.onLeave}
        onPick={r.onPick}
        pickForMe={r.pickForMe}
      />

      <Belief />

      <Idea price={r.price} total={r.total} />

      <Impact />

      <Tracker
        claimed={reservations.claimed}
        total={r.total}
        raised={reservations.raised}
        price={r.price}
      />

      <HowItWorks price={r.price} blockPrice={r.blockPrice} />

      <Pricing price={r.price} blockPrice={r.blockPrice} />

      <FabricCTA />

      <ReachStats />

      <FinalAsk onJoin={r.setCustomise} price={r.price} />

      <Footer />

      {r.editor && (
        <EditorModal
          editor={r.editor}
          reserved={reservations.reserved}
          reviewLens={r.reviewLens}
          price={r.price}
          blockPrice={r.blockPrice}
          closeEditor={r.closeEditor}
          stop={r.stop}
          setBigTrue={r.setBigTrue}
          setBigFalse={r.setBigFalse}
          setActiveSlot={r.setActiveSlot}
          tabLogoClick={r.tabLogoClick}
          tabMsgClick={r.tabMsgClick}
          tabDoodleClick={r.tabDoodleClick}
          onLogoFile={r.onLogoFile}
          onLogoDrop={r.onLogoDrop}
          onMsgInput={r.onMsgInput}
          attachCanvas={r.attachCanvas}
          clearDoodle={r.clearDoodle}
          goReview={r.goReview}
          backToEdit={r.backToEdit}
          goDetails={r.goDetails}
          backToReview={r.backToReview}
          onNameInput={r.onNameInput}
          onSizeChange={r.onSizeChange}
          onEmailInput={r.onEmailInput}
          onPhoneInput={r.onPhoneInput}
          onReviewMove={r.onReviewMove}
          onReviewLeave={r.onReviewLeave}
          checkout={reservations.checkout}
          isCheckingOut={reservations.isCheckingOut}
        />
      )}

      <Toast message={r.toast} />

      <PaymentSuccessModal open={reservations.paymentSuccess} onClose={reservations.dismissPaymentSuccess} />
    </div>
  );
}
