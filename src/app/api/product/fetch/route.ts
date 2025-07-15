import { fetchProduct } from "@/lib/firebase/services";
import { NextResponse } from "next/server";

export async function GET() {
  const products = await fetchProduct("products");

  return NextResponse.json({
    message: "Success",
    status: 200,
    data: products,
  });
}
