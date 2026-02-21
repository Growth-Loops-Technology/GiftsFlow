import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Protected vendor routes
  if (request.nextUrl.pathname.startsWith("/portal")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login?callbackUrl=/portal", request.url));
    }

    if ((token as any).role !== "VENDOR" && (token as any).role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Protected admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login?callbackUrl=/admin", request.url));
    }

    if ((token as any).role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*"],
};
