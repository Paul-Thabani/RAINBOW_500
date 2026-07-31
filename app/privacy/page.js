import LegalPage, { P, H, UL, A, Rows, ENTITY } from "../../components/LegalPage";

export const metadata = {
  title: "Privacy notice · The Legacy 500",
  description:
    "What personal information the Legacy 500 collects, why, who it is shared with, and your rights under POPIA.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

// Written against what the code actually does rather than from a template. Every
// claim here is checkable in the repo: the checkout route is what collects, the
// claimed_squares view is what makes the public board safe, and the notify route
// is what triggers the receipt.
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy notice"
      updated="31 July 2026"
      intro={
        <P>
          This notice covers <strong style={{ color: "#eef1f6" }}>shirt.hbufc.co.za</strong>, the
          Legacy 500 kit campaign. It explains what we collect when you claim a square, why, who
          else sees it, and what you can ask us to do about it. The responsible party under POPIA
          is {ENTITY.supplier}.
        </P>
      }
    >
      <H id="what">What we collect</H>
      <P>Only what claiming a square actually requires. There is no account to create and no tracking.</P>
      <Rows
        pairs={[
          ["Email address", "So we can send your receipt and contact you about your square and your shirt size."],
          ["Mobile number", "So we can reach you about your order if email fails."],
          ["Your artwork", "The logo, message or doodle you place on your square. This is printed on the shirt and shown on the board once your payment clears."],
          ["Payment reference and amount", "So we can match your payment to your square and prove it if you ever query it."],
        ]}
      />
      <P>
        We do not ask for your name, your address or your date of birth, and we never see or store
        your card details. Those go straight to Netcash and never touch our server.
      </P>

      <H id="public">What other people can see</H>
      <P>
        Your artwork becomes public once your payment is confirmed. That is the point of the
        campaign. Nothing else does.
      </P>
      <P>
        The endpoint the shirt reads is deliberately built so it cannot leak the rest: the database
        view behind it does not contain the email or mobile columns at all, so no future change to
        that endpoint can accidentally publish them. Artwork from a checkout that was started but
        never paid for is never shown to anyone.
      </P>

      <H id="who">Who else we give it to</H>
      <Rows
        pairs={[
          ["Netcash", "South Africa. Processes the payment. Receives the amount, a reference and, where you have given them, your email and mobile so you do not have to type them again."],
          ["Resend", "United States. Sends your receipt, so it processes your email address and the contents of that email."],
          ["Nobody else", "We do not sell, rent or share personal information for marketing, and there is no advertising or analytics code on this site."],
        ]}
      />
      <P>
        Because Resend sends from infrastructure in the United States, your email address leaves
        South Africa when we email you. POPIA allows this where the recipient is bound to comparable
        protections, which their data processing terms provide.
      </P>
      <P>
        Two smaller ones worth naming. The site loads its typeface from Google Fonts, so Google
        receives your IP address when a page loads. Our web server keeps ordinary access logs,
        which include IP addresses, for troubleshooting and abuse handling.
      </P>

      <H id="where">Where it is kept, and for how long</H>
      <P>
        On our own server in South Africa. The database accepts connections only from the machine
        itself, so it is not reachable from the internet at all. Staff access to order details is
        behind a password.
      </P>
      <P>
        We keep your order for as long as the shirt exists as a record, because the square is meant
        to be permanent and we may need to prove who claimed it. We keep your artwork because it has
        to be printed. If you ask us to delete your personal details after your shirt has been
        delivered, we will, and we will keep only what we are legally required to keep for tax and
        accounting purposes.
      </P>

      <H id="rights">Your rights</H>
      <P>Under POPIA you can ask us to:</P>
      <UL>
        <li>tell you what we hold about you</li>
        <li>correct anything that is wrong</li>
        <li>delete anything we no longer have a good reason to keep</li>
        <li>stop contacting you, which we will do without argument</li>
      </UL>
      <P>
        Email <A href={`mailto:${ENTITY.email}`}>{ENTITY.email}</A> and we will answer. If you are
        not satisfied with how we handle it, you can complain to the Information Regulator of South
        Africa at <A href="https://inforegulator.org.za">inforegulator.org.za</A>.
      </P>

      <H id="children">Children</H>
      <P>
        The Legacy 500 is sold to adults. If you are under 18, ask a parent or guardian to claim the
        square instead. If you believe a child has given us personal information, tell us and we
        will remove it.
      </P>

      <H id="changes">Changes</H>
      <P>
        If we change how any of this works we will change this page and move the date at the top. We
        will not quietly start doing something with your information that this page does not
        describe.
      </P>
    </LegalPage>
  );
}
