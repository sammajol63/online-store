import { NextResponse } from "next/server";
import { initMidtrans } from "@/app/utils/midtrans";
import { pendingTransaction } from "@/lib/firebase/services";

export async function POST(request: Request) {
  const req = await request.json();
  const snap = initMidtrans();

  try {
    const item_details = req.cart.map(
      (item: {
        name: string;
        price: number;
        qty: number;
        product_id: string;
      }) => ({
        id: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.qty,
      })
    );

    const gross_amount = item_details.reduce(
      (total: number, item: { price: number; quantity: number }) => {
        return total + item.price * item.quantity;
      },
      0
    );

    const parameter = {
      transaction_details: {
        order_id: `ORDER-${Date.now()}`,
        gross_amount,
      },
      customer_details: {
        fullname: req.name,
        email: req.email,
        address: req.address,
        lat: req.lat,
        lon: req.lon,
      },
      item_details,
      callbacks: {
        finish: "/product/purchase/",
      },
    };

    await pendingTransaction({
      user: parameter.customer_details,
      items: parameter.item_details,
      order_id: parameter.transaction_details.order_id,
    });

    const transaction = await snap.createTransaction(parameter);

    return NextResponse.json({ token: transaction.token });
  } catch (error) {
    console.error("Midtrans Error", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
