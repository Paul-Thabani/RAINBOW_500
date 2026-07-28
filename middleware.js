import { NextResponse } from "next/server";

// Gates /admin behind HTTP Basic Auth. Simple on purpose - this is a single
// internal user checking order status, not a multi-user auth system.
// Requires ADMIN_USER / ADMIN_PASSWORD in .env.local (see .env.local.example).
export function middleware(request) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;

  if (!user || !pass) {
    return new NextResponse(
      "Admin access isn't configured - set ADMIN_USER and ADMIN_PASSWORD in .env.local",
      { status: 500 }
    );
  }

  const auth = request.headers.get("authorization");
  if (auth && auth.startsWith("Basic ")) {
    const [u, p] = Buffer.from(auth.slice(6), "base64").toString().split(":");
    if (u === user && p === pass) return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Rainbow 500 admin"' },
  });
}

export const config = { matcher: "/admin/:path*" };
