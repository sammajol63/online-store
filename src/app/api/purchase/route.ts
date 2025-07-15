import { purchase } from "@/lib/firebase/services";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const req = await request.json();
  const res = await purchase(req);

  return NextResponse.json(
    {
      status: res.status,
      dataTransaction: res.dataTransaction,
      dataDeliveries: res.dataDeliveries,
      image: res.image,
    },
    { status: res.statusCode }
  );
}
