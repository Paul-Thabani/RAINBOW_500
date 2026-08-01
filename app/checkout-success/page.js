import { redirect } from "next/navigation";

// This is the Accept URL configured in the Netcash dashboard (Account
// Profile -> NetConnector -> Pay Now). Netcash appends our m10 field
// ("ref=<reference>") as a query string here - Netcash's docs say the base
// URL itself must not already contain "?", which is why this can't just be
// "/?checkout=success" directly. It hands straight back to the main page,
// which shows the actual toast/notice.
export default async function CheckoutSuccess({ searchParams }) {
  const sp = await searchParams;
  const ref = typeof sp?.ref === "string" ? sp.ref.trim() : "";
  // With a reference we can show the buyer their own order and ask for the
  // address we still need, so send them there rather than to a toast on the
  // home page. Without one there is nothing to look up, so fall back to the
  // old behaviour.
  if (ref) redirect(`/collect?ref=${encodeURIComponent(ref)}`);
  redirect("/?checkout=success");
}
