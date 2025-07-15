"use client";

import { fetchDeliveries } from "@/features/counter/counterSlice";
import type { RootState } from "../store/page";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSession } from "next-auth/react";
import { Session } from "next-auth";
import type { AppDispatch } from "../store/page";
import { useSearchParams } from "next/navigation";

const DeliveryMap = dynamic(() => import("./deliveryMap"), { ssr: false });

export default function DeliveryPage() {
  const searchParams = useSearchParams();
  const transaction_id = searchParams.get("transaction_id");
  const { data: session } = useSession() as {
    data: Session | null;
  };
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const email = session?.user?.email ?? null;
    if (transaction_id) {
      dispatch(fetchDeliveries({ email, transaction_id }));
    }
  }, [dispatch, session?.user?.email, transaction_id]);

  const deliveryData = useSelector(
    (state: RootState) => state.counter.delivery
  );

  const origin = { lat: -6.2653276, lon: 106.7846567 };
  const [destination, setDestination] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  useEffect(() => {
    if (
      Array.isArray(deliveryData) &&
      deliveryData.length > 0 &&
      deliveryData[0].lat &&
      deliveryData[0].lon
    ) {
      setDestination({
        lat: deliveryData[0].lat,
        lon: deliveryData[0].lon,
      });
    }
  }, [deliveryData]);

  return (
    <main>
      {destination && <DeliveryMap origin={origin} destination={destination} />}{" "}
    </main>
  );
}
