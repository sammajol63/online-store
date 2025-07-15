import { updateStatusDelivery } from "@/lib/firebase/services";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const req = await request.json();
  const res = await updateStatusDelivery(req.transaction_id);
  return NextResponse.json({
    message: res.message,
    status: res.status,
    statusCode: res.statusCode,
  });
}
