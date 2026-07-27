import { redirect } from "next/navigation";

// Decline URL configured in the Netcash dashboard - see
// app/checkout-success/page.js for why this redirect hop exists.
export default async function CheckoutCancelled() {
  redirect("/?checkout=cancelled");
}
