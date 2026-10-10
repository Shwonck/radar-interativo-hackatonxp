import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Proteção de navegação do protótipo baseada no cookie criado pelo login local.
  const signedIn = request.cookies.get("xp-demo-session")?.value === "active";

  if (
    ["/dashboard", "/clientes", "/conexoes", "/oportunidades"].some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    ) &&
    !signedIn
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (
    signedIn &&
    (pathname === "/" ||
      pathname.startsWith("/esqueceu-sua-senha") ||
      pathname.startsWith("/recuperar-senha"))
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/clientes/:path*",
    "/conexoes/:path*",
    "/oportunidades/:path*",
    "/esqueceu-sua-senha",
    "/recuperar-senha/:path*",
  ],
};
