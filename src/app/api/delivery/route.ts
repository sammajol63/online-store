import { fetchDeliveries } from "@/lib/firebase/services";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const req = await request.json();
  const res = await fetchDeliveries({
    email: req.email,
    transaction_id: req.transaction_id,
  });
  return NextResponse.json({
    message: "Success",
    status: 200,
    data: res,
  });
}
