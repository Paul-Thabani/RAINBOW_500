import { redirect } from "next/navigation";

// This is the Accept URL configured in the Netcash dashboard (Account
// Profile -> NetConnector -> Pay Now). Netcash appends our m10 field
// ("ref=<reference>") as a query string here - Netcash's docs say the base
// URL itself must not already contain "?", which is why this can't just be
// "/?checkout=success" directly. It hands straight back to the main page,
// which shows the actual toast/notice.
export default async function CheckoutSuccess({ searchParams }) {
  const sp = await searchParams;
  const ref = sp?.ref ? `&ref=${encodeURIComponent(sp.ref)}` : "";
  redirect(`/?checkout=success${ref}`);
}
