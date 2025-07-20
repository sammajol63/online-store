"use client";
import { Session } from "next-auth";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/index";

type SuggestionItem = {
  addresstype: string;
  boundingbox: Array<{ 0: string; 1: string; 2: string; 3: string }>;
  class: string;
  display_name: string;
  importance: number;
  lat: number;
  licence: string;
  lon: number;
  name: string;
  osm_id: number;
  osm_type: string;
  place_id: number;
  place_rank: number;
  type: string;
};

interface MidtransResult {
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  status_message: string;
  status_code: string;
  fraud_status?: string;
  va_numbers?: Array<{ bank: string; va_number: string }>;
  permata_va_number?: string;
  biller_code?: string;
  bill_key?: string;
  payment_code?: string;
  pdf_url?: string;
}

export default function PayAndAddress() {
  const [searchAlamat, setSearchAlamat] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [token, setToken] = useState("");
  const TempQty = useSelector((state: RootState) => state.counter.tempQty);

  const [selected, setSelected] = useState<{
    lat: number;
    lon: number;
    display_name: string;
  } | null>(null);

  const { data: session } = useSession() as {
    data: Session | null;
    status: "authenticated" | "unauthenticated" | "loading";
  };

  const product = useSelector(
    (state: RootState) => state.counter.detailProduct
  );

  const handleSuggestions = (item: {
    addresstype: string;
    boundingbox: Array<{ 0: string; 1: string; 2: string; 3: string }>;
    class: string;
    display_name: string;
    importance: number;
    lat: number;
    licence: string;
    lon: number;
    name: string;
    osm_id: number;
    osm_type: string;
    place_id: number;
    place_rank: number;
    type: string;
  }) => {
    setSelected(item);
    setSearchAlamat(item.display_name);
    setSuggestions([]);
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", process.env.MIDTRANS_CLIENT_KEY!);
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [token]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchAlamat.length < 3) return setSuggestions([]);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchAlamat
        )}`
      );
      const data = await res.json();
      setSuggestions(data);
    };

    const delayDebounce = setTimeout(() => {
      fetchSuggestions();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchAlamat]);

  let isPaying = false;

  const HandlePay = async () => {
    if (isPaying) return;
    isPaying = true;

    setIsProcessing(true);
    const name = session?.user?.name;
    const email = session?.user?.email;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/midtrans/token`,
      {
        method: "POST",
        body: JSON.stringify({
          name: name,
          email: email,
          address: searchAlamat,
          lat: selected?.lat,
          lon: selected?.lon,
          cart: [
            {
              name: product?.name,
              price: product?.price,
              qty: TempQty > 0 ? TempQty : product?.qty,
              product_id: product?.id,
            },
          ],
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await res.json();

    setToken(data.token);

    if (!data.token) {
      setIsProcessing(false);
      throw new Error("Token not found");
    }

    window.snap.pay(data.token, {
      onSuccess: async function (result: MidtransResult) {
        console.log("Payment Success:", result);
      },
      onPending: function (result: MidtransResult) {
        console.log("Payment Pending:", result);
        setToken("");
        setIsProcessing(false);
      },
      onError: function (result: MidtransResult) {
        console.log("Payment Error:", result);
        setToken("");
        setIsProcessing(false);
      },
      onClose: function () {
        console.log("Payment popup closed");
        setToken("");
        setIsProcessing(false);
      },
    });
  };

  return (
    <div className="flex flex-col w-full items-center justify-center">
      <div className="py-4 w-full flex flex-col items-end-start">
        <input
          type="text"
          className="text-xs border border-gray-300 text-gray-400 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-300 w-full"
          placeholder="Tulis Nama Alamat"
          value={searchAlamat}
          onChange={(e) => setSearchAlamat(e.target.value)}
        />
        {suggestions.length > 0 && (
          <ul className="z-10 bg-white w-[220px] max-h-60 overflow-y-auto text-sm mt-2">
            {suggestions.map((item, index) => (
              <li
                key={index}
                onClick={() => handleSuggestions(item)}
                className="p-2 hover:bg-gray-100 cursor-pointer"
              >
                {item.display_name}
              </li>
            ))}
          </ul>
        )}

        {selected && (
          <div className="mt-2 text-xs shadow w-full min-h-[100px] flex flex-col gap-y-2 items-start p-2 rounded-lg">
            <p className="text-gray-500">ALAMAT PENGIRIMAN</p>
            <p>{selected.display_name}</p>
            {/* <p>
              Koordinat: {selected.lat}, {selected.lon}
            </p> */}
          </div>
        )}
      </div>

      <div className="mt-2">
        <button
          onClick={HandlePay}
          disabled={
            isProcessing ||
            !selected?.lat ||
            !selected?.lon ||
            !selected?.display_name ||
            (product?.qty ?? 0) < 1
          }
          className={`bg-green-500 rounded-lg w-36 cursor-pointer h-8 text-xs font-bold text-white ${
            isProcessing || (product?.qty ?? 0) < 1 || !selected
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
        >
          {isProcessing ? "Memproses..." : "Bayar Sekarang"}
        </button>
      </div>
    </div>
  );
}
