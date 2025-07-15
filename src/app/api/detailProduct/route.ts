import { detailProduct } from "@/lib/firebase/services";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const req = await request.json();
  const res = await detailProduct(req);
  return NextResponse.json({
    data: res.data,
    message: res.message,
    status: res.status,
  });
}
