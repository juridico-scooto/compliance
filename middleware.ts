import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Rotas admin-only
    if (
      (path.startsWith("/due-diligence") || path.startsWith("/historico")) &&
      token?.role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/acesso-negado", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/due-diligence/:path*",
    "/historico/:path*",
    "/politicas/:path*",
    "/treinamentos/:path*",
    "/perfil/:path*",
    "/perfil",
  ],
};
