import { transaction } from "@/lib/firebase/services";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const text = await request.text();

    if (!text) {
      console.error("❌ Body kosong diterima!");
      return NextResponse.json(
        { status: false, message: "Empty body received" },
        { status: 400 }
      );
    }

    const req = JSON.parse(text);
    // const req = await request.json();

    const res = await transaction(req);

    return NextResponse.json(
      { status: res.status, message: res.message },
      { status: res.statusCode }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { status: false, message: "Unexpected server error" },
      { status: 500 }
    );
  }
}
