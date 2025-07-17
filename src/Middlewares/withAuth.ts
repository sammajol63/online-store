import { getToken } from "next-auth/jwt";
import {
  NextFetchEvent,
  NextMiddleware,
  NextRequest,
  NextResponse,
} from "next/server";

function matchPath(pattern: string, path: string) {
  const regex = new RegExp(
    "^" + pattern.replace(/:[^\/]+/g, "[^/]+").replace("*", ".*") + "$"
  );
  return regex.test(path);
}

// const onlyAdminPage = ["/dashboard"];
const authPage = ["/login", "/"];

export default function withAuth(
  middleware: NextMiddleware,
  requiredAuth: string[] = [] // ini utk autentikasi url yg di batasi dgn middlware
) {
  return async (req: NextRequest, next: NextFetchEvent) => {
    const pathname = req.nextUrl.pathname;

    if (
      requiredAuth.some((route) =>
        route.includes(":") // pattern match
          ? matchPath(route, pathname)
          : pathname === route || pathname.startsWith(route + "/")
      )
    ) {
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token && !authPage.includes(pathname)) {
        const url = new URL("/login", req.url); //ini url tujuan klw mau akses product tp belum login
        const callbackUrl = req.nextUrl.pathname + req.nextUrl.search;
        url.searchParams.set("callbackUrl", callbackUrl); // ini utk seumpamanya sudah login maka di alihkan langsung ke halaman yg di tuju sebelum login

        return NextResponse.redirect(url);
      }

      if (token) {
        if (authPage.includes(pathname)) {
          return NextResponse.redirect(new URL("/product", req.url));
        }

        // if (token.role !== "admin" && onlyAdminPage.includes(pathname)) {
        //   return NextResponse.redirect(new URL("/", req.url));
        // }
      }
    }

    return middleware(req, next);
  };
}
