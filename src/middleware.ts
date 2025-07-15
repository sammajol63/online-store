import { NextResponse } from "next/server";
import withAuth from "./Middlewares/withAuth";

export function mainMiddleware() {
  const res = NextResponse.next();
  return res;
}

export default withAuth(mainMiddleware, ["/product", "/login", "/"]);
