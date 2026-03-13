import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/"],
};

export async function middleware(req: NextRequest) {
  const hostHeader = req.headers.get("host") || "";
  const host = hostHeader.split(":")[0].toLowerCase();

  // Não interferir com domínio principal nem previews
  if (!host || host === "kardme.com" || host === "www.kardme.com" || host.endsWith(".vercel.app")) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  const baseUrl = `${url.protocol}//${hostHeader}`;

  const res = await fetch(`${baseUrl}/api/public/resolve-domain?host=${encodeURIComponent(host)}`, {
    cache: "no-store",
  });

  if (!res.ok) return NextResponse.next();

  const data = await res.json().catch(() => null);
  if (data?.slug) {
    url.pathname = `/${data.slug}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
