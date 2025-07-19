"use client";
import {
  CartItem,
  DeleteProductCart,
  setModal,
  UpdateQty,
} from "@/features/counter/counterSlice";
import { RootState } from "@/store/index";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store/index";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Session } from "next-auth";
import {
  filterAvailableCart,
  filterNotAvailableCart,
} from "@/lib/firebase/services";
import cartsListener from "@/app/hooks/cartsListener";
import { MdClose, MdDelete } from "react-icons/md";
import { FaRegSquareMinus, FaRegSquarePlus } from "react-icons/fa6";

interface SuggestionItem {
  addresstype: string;
  boundingbox: string[];
  class: string;
  display_name: string;
  importance: number;
  lat: string;
  licence: string;
  lon: string;
  name: string;
  osm_id: number;
  osm_type: string;
  place_id: number;
  place_rank: number;
  type: string;
}

export default function CartPage(isOpen: { isOpen: boolean }) {
  const cart = useSelector((state: RootState) => state.counter.cart);
  const products = useSelector((state: RootState) => state.counter.products);
  const error = useSelector((state: RootState) => state.counter.isError);

  const { data: session } = useSession() as {
    data: Session | null;
    status: "authenticated" | "unauthenticated" | "loading";
  };

  const useAppDispatch = () => useDispatch<AppDispatch>();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const [total, setTotal] = useState(0);
  const [token, setToken] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const productAvailable = filterAvailableCart(cart, products);
  const productNotAvailable = filterNotAvailableCart(cart, products);
  const [searchAlamat, setSearchAlamat] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);

  const [selected, setSelected] = useState<{
    lat: number;
    lon: number;
    display_name: string;
  } | null>(null);

  useEffect(() => {
    const result = productAvailable.reduce((acc: number, item: CartItem) => {
      return acc + item.price * item.qty;
    }, 0);
    setTotal(result);
  }, [productAvailable]);

  const user_id = session?.user?.email;
  useEffect(() => {
    if (!user_id || products.length === 0) return;
    const unsubscribe = cartsListener(user_id, dispatch);

    return () => {
      unsubscribe(); // ✅ auto-cleanup listener saat komponen unmount
    };
  }, [user_id, products.length, dispatch]);

  const formatRupiah = (number: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);

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

  let isPaying = false;

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
          cart: productAvailable,
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

  const handleSuggestions = (item: {
    addresstype: string;
    boundingbox: Array<string>;
    class: string;
    display_name: string;
    importance: number;
    lat: string;
    licence: string;
    lon: string;
    name: string;
    osm_id: number;
    osm_type: string;
    place_id: number;
    place_rank: number;
    type: string;
  }) => {
    setSelected({
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      display_name: item.display_name,
    });
    setSearchAlamat(item.display_name);
    setSuggestions([]);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 overflow-auto">
      <div className="bg-white w-full max-w-[750px] max-h-[90vh] overflow-y-auto p-4 sm:p-8 rounded">
        <div className="flex justify-between pb-2">
          <div>
            <span className="font-bold">Cart</span>
          </div>
          <button
            onClick={() => dispatch(setModal(false))}
            className=" text-gray-500 text-xl w-5 h-5 font-bold flex justify-center items-center cursor-pointer"
          >
            <MdClose />
          </button>
        </div>
        {error && (
          <div className="text-red-500 text-xs font-semibold mb-2">
            ⚠️ {error}
          </div>
        )}

        <div className="shadow w-full overflow-x-auto">
          <div className="min-w-[600px]">
            <table className="text-center w-full table-fixed ">
              <thead className="bg-gray-100 text-sm uppercase font-bold">
                <tr>
                  <th className=" px-2 py-2 w-48">Name</th>
                  <th className=" w-28">QTY</th>
                  <th className=" px-2 w-40">Price</th>
                  <th className=" px-2 w-32">ACTION</th>
                </tr>
              </thead>
            </table>
            <div className="h-[200px] overflow-y-auto scrollbar-auto-hide">
              <table className="w-full table-fixed text-sm text-center">
                <tbody>
                  {productAvailable.length === 0 &&
                  productNotAvailable.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center text-lg py-4 font-bold"
                      >
                        Keranjang kosong
                      </td>
                    </tr>
                  ) : (
                    <>
                      {productAvailable.map((product, index) => (
                        <tr key={index}>
                          <td
                            title={product.name}
                            className="border-b w-48 border-gray-300 px-2 py-2 truncate"
                          >
                            {product.name}
                          </td>
                          <td className="border-b border-gray-300 px-2 w-28">
                            {product.qty}
                          </td>
                          <td className="border-b border-gray-300 px-2 w-40">
                            {formatRupiah(product.price * product.qty)}
                          </td>
                          <td className="border-b border-gray-300 w-32 ">
                            <div className="gap-x-2 flex flex-row justify-center items-center">
                              <button
                                onClick={() => {
                                  dispatch(
                                    UpdateQty({
                                      user_id: product.user_id,
                                      operation: "Increment",
                                      product_id: product.product_id,
                                    })
                                  );
                                }}
                                className="w-5 h-5 text-xl  text-black font-bold cursor-pointer"
                              >
                                <FaRegSquarePlus />
                              </button>
                              <button
                                disabled={product.qty <= 1}
                                onClick={() => {
                                  dispatch(
                                    UpdateQty({
                                      user_id: product.user_id,
                                      operation: "Decrement",
                                      product_id: product.product_id,
                                    })
                                  );
                                }}
                                className={`cursor-pointer w-5 h-5 text-black font-bold text-xl ${
                                  product.qty <= 1
                                    ? "text-gray-400"
                                    : "text-black"
                                }`}
                              >
                                <FaRegSquareMinus />
                              </button>
                              <button
                                className="cursor-pointer text-xl font-bold text-red-500"
                                onClick={() =>
                                  dispatch(
                                    DeleteProductCart({
                                      user_id: product.user_id,
                                      product_id: product.product_id,
                                    })
                                  )
                                }
                              >
                                <MdDelete />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {productNotAvailable.map((product, index) => (
                        <tr key={index} className="bg-black/30">
                          <td className="border-b border-gray-300 px-2 py-2 truncate w-30">
                            {product.name}
                          </td>
                          <td className="border-b border-gray-300 px-2">0</td>
                          <td className="border-b border-gray-300 px-2">
                            {formatRupiah(product.price * product.qty)}
                          </td>
                          <td className="border-b w-32 border-gray-300 px-2 py-2 gap-x-2">
                            <div className="flex justify-center items-center flex-row text-[10px]">
                              Product tidak tersedia
                              <button
                                className="w-5 cursor-pointer text-xl font-bold text-red-500"
                                onClick={() =>
                                  dispatch(
                                    DeleteProductCart({
                                      user_id: product.user_id,
                                      product_id: product.product_id,
                                    })
                                  )
                                }
                              >
                                <MdDelete />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
              <div />
            </div>
          </div>
        </div>

        <div className="py-2">
          <span className="text-xs font-bold text-gray-700 mr-2">
            ALAMAT PENGIRIMAN
          </span>
          <input
            type="text"
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-300"
            placeholder="Masukkan Alamat Tujuan..."
            value={searchAlamat}
            onChange={(e) => setSearchAlamat(e.target.value)}
          />
          {suggestions.length > 0 && (
            <ul className="absolute z-10 bg-white border w-full max-h-60 overflow-y-auto text-sm">
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
            <div className="mt-2 text-sm bg-gray-50 p-1">
              <strong>Alamat dipilih:</strong>
              <p className="text-xs">{selected.display_name}</p>
              <p className="text-xs">
                Koordinat: {selected.lat}, {selected.lon}
              </p>
            </div>
          )}
        </div>
        <div className="border border-gray-200 font-bold py-4 px-4 flex justify-between items-center w-full">
          <div>TOTAL {formatRupiah(total)}</div>
          <div>
            <button
              onClick={HandlePay}
              disabled={isProcessing || !selected}
              className={`bg-green-500 rounded-lg w-36 cursor-pointer h-10 text-xs font-bold text-white ${
                isProcessing || !selected ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isProcessing ? "Memproses..." : "Bayar Sekarang"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
