import { getToken } from "next-auth/jwt";
import {
  NextFetchEvent,
  NextMiddleware,
  NextRequest,
  NextResponse,
} from "next/server";

// const onlyAdminPage = ["/dashboard"];
const authPage = ["/login", "/"];

export default function withAuth(
  middleware: NextMiddleware,
  requiredAuth: string[] = [] // ini utk autentikasi url yg di batasi dgn middlware
) {
  return async (req: NextRequest, next: NextFetchEvent) => {
    const pathname = req.nextUrl.pathname;

    if (requiredAuth.includes(pathname)) {
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token && !authPage.includes(pathname)) {
        const url = new URL("/login", req.url); //ini url tujuan klw mau akses product tp belum login
        url.searchParams.set("callbackUrl", encodeURI(req.url)); // ini utk seumpamanya sudah login maka di alihkan langsung ke halaman yg di tuju sebelum login

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
