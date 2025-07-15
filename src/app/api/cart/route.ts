import { cartSync } from "@/lib/firebase/services";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const req = await request.json();

  const res = await cartSync(req);

  return NextResponse.json(
    {
      status: res?.status,
      message: res?.message,
    },
    { status: res?.statusCode || 500 }
  );
}
