"use client";

import { useEffect } from "react";
import useRainbow500, { fmt } from "../lib/useRainbow500";
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
