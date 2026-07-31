import LegalPage, { P, H, UL, A, Rows, ENTITY } from "../../components/LegalPage";

export const metadata = {
  title: "Terms and conditions · The Legacy 500",
  description:
    "The terms for claiming a square on the Legacy 500 kit: what you get, what you may put on it, refunds, and what happens if the 500 squares are not all claimed.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms and conditions"
      updated="31 July 2026"
      intro={
        <P>
          These are the terms for claiming a square on the Legacy 500 kit at{" "}
          <strong style={{ color: "#eef1f6" }}>shirt.hbufc.co.za</strong>. Claiming a square means
          you accept them. They are written to be read, not to hide anything, so if something here
          is unclear please ask before you pay.
        </P>
      }
    >
      <H id="what-you-get">What you are buying</H>
      <P>
        One shirt has been divided into 500 squares. When you claim a square you are buying the
        right to place a logo, a short message or a doodle in that square on the printed kit, and to
        have it shown in that position on this website.
      </P>
      <Rows
        pairs={[
          ["A single square", "R2,000"],
          ["A block of four", "R7,000"],
          ["Included with every square", "One shirt, sent to you as a thank you, once the kit is produced"],
          ["Total squares", "500"],
        ]}
      />
      <P>
        The price you see is the price you pay. Nothing is added at checkout, and we do not charge a
        booking or handling fee.
      </P>

      <H id="claiming">Claiming and paying</H>
      <P>
        A square is held for you the moment you start checking out, so that two people cannot buy
        the same one. If you do not complete the payment, that hold expires after about twenty
        minutes and the square goes back on the board. Your square is only confirmed once Netcash
        tells us the payment succeeded, and that is also when your artwork appears on the shirt.
      </P>
      <P>
        Very occasionally a payment succeeds at the same moment as somebody else claims the same
        square. If that happens we will refund you in full and help you pick another one. We would
        rather tell you that plainly than pretend it cannot happen.
      </P>

      <H id="your-artwork">Your artwork</H>
      <P>By uploading anything you confirm that you are allowed to use it. Specifically, that:</P>
      <UL>
        <li>you own it, or you have the owner&apos;s permission to put it on a football shirt and on this website</li>
        <li>it does not infringe anybody&apos;s trade mark, copyright or other rights</li>
        <li>it is not hateful, discriminatory, obscene, political, or promoting gambling, alcohol, tobacco or anything unlawful</li>
      </UL>
      <P>
        You keep ownership of your artwork. You give us permission to reproduce it on the kit, on
        this website, and in photographs and marketing of the kit and the campaign. That permission
        lasts as long as the kit does, because the whole idea is that the square is permanent.
      </P>
      <P>
        We can refuse or remove artwork that breaks the rules above, or that we cannot print
        legibly. If we do, we will tell you why and either let you replace it or refund you in full.
        We would rather have that conversation than print something the club has to apologise for.
      </P>

      <H id="printing">What we cannot promise about the printing</H>
      <P>
        Your square&apos;s position on the shirt is fixed and is what you chose. The exact placement
        of your artwork inside that square can shift very slightly in production, and printed colour
        never matches a screen exactly. Fine detail and very thin lines may soften at this size, so a
        simple, bold design will always survive better than an intricate one.
      </P>

      <H id="completion">When the kit gets made</H>
      <P>
        We produce the kit once all 500 squares have been claimed. We will then email you a short
        form to capture your shirt size, and send your shirt as a thank you.
      </P>
      <P>
        If all 500 squares are not claimed within twelve months of your purchase, we will contact you
        and you can choose either a full refund or to leave your payment with the club as a donation.
        You will not be left without an answer, and we will not keep your money indefinitely on the
        strength of a target that has not been met.
      </P>

      <H id="refunds">Refunds</H>
      <P>
        Every square is printed to your own design, so once your payment has cleared we cannot resell
        it. For that reason we do not offer a change of mind refund. You do get a full refund if:
      </P>
      <UL>
        <li>we cannot give you the square you paid for</li>
        <li>we refuse or remove your artwork and you do not want to replace it</li>
        <li>the kit is not produced, as described above</li>
        <li>we have made a mistake, or charged you twice</li>
      </UL>
      <P>
        Refunds go back the way they came, through Netcash, to the card or account you paid from.
        Email <A href={`mailto:${ENTITY.email}`}>{ENTITY.email}</A> with your payment reference and we
        will sort it out.
      </P>

      <H id="delivery">Getting your shirt</H>
      <P>
        Shirts are produced in one run after the campaign completes, not one at a time, so there is
        no dispatch date to give you until then. We will tell you the timeline when we ask for your
        size. If a shirt arrives faulty, tell us and we will replace it.
      </P>

      <H id="liability">Liability</H>
      <P>
        We do our best but we are a community football club, not a printing house. Except where the
        law does not allow us to limit it, our responsibility to you is capped at what you paid for
        your square. Nothing in these terms takes away rights you have under the Consumer Protection
        Act or the Electronic Communications and Transactions Act.
      </P>

      <H id="law">Governing law</H>
      <P>
        These terms are governed by South African law, and the courts of South Africa have
        jurisdiction over any dispute. Talk to us first though. Almost everything is quicker to fix
        by email than by anything else.
      </P>
    </LegalPage>
  );
}
