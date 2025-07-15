import { NextRequest, NextResponse } from "next/server";
import { delivery, transaction } from "@/lib/firebase/services";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const res = await transaction(payload);
    await delivery(payload);

    return NextResponse.json({
      status: true,
      message: res.message,
    });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return NextResponse.json(
      { status: false, message: "Webhook failed" },
      { status: 200 }
    );
  }
}
