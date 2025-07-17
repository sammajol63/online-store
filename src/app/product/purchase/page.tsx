"use client";
import { AppDispatch, RootState } from "@/store";
import {
  purchaseOrder,
  setModalDetailTransaction,
} from "@/features/counter/counterSlice";
import { Timestamp } from "firebase/firestore";
import { Session } from "next-auth";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import CartPage from "../cartPage";
import { useRouter } from "next/navigation";
import { MdClose } from "react-icons/md";

export default function PurchasePage() {
  const dispatch = useDispatch<AppDispatch>();
  const [idOrder, setIdOrder] = useState("");
  const modal = useSelector((state: RootState) => state.counter.modal);
  const router = useRouter();
  const isLoading = useSelector(
    (state: RootState) => state.counter.isLoadingPurchase
  );
  const modalDetailTransaction = useSelector(
    (state: RootState) => state.counter.modalDetailTransaction
  );
  const purchaseProduct = useSelector(
    (state: RootState) => state.counter.purchase
  );
  const hasFetchedPurchase = useSelector(
    (state: RootState) => state.counter.hasFetchedPurchase
  );
  const { data: session } = useSession() as {
    data: Session | null;
  };

  useEffect(() => {
    if (session) {
      dispatch(purchaseOrder(session?.user?.email ?? null));
    }
  }, [session, dispatch]);

  function getReadableDate(
    created_at: Timestamp | { seconds: number } | undefined
  ): string {
    try {
      if (created_at instanceof Timestamp) {
        return created_at.toDate().toLocaleString();
      } else if (created_at && created_at.seconds) {
        // Hasil decode dari JSON.stringify Firestore Timestamp
        const date = new Date(created_at.seconds * 1000);
        return date.toLocaleString();
      } else {
        return "Invalid date format";
      }
    } catch (e) {
      console.log(e);

      return "Invalid date";
    }
  }

  const formatRupiah = (number: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);

  const filterData = (purchaseProduct ? [...purchaseProduct] : [])?.sort(
    (a, b) => {
      if (a.status === "Dalam pengiriman" && b.status !== "Dalam pengiriman") {
        return -1;
      }
      if (a.status !== "Dalam pengiriman" && b.status === "Dalam pengiriman") {
        return 1;
      }
      return 0;
    }
  );

  return (
    <div className="h-full w-full py-2 flex flex-row justify-center items-start gap-x-6 gap-y-2 pt-29">
      <div className="min-h-[420px] w-[250px] rounded-lg border border-gray-300">
        <div className="w-full h-12 border-b font-bold flex justify-center items-center border-gray-400">
          {session?.user?.name}
        </div>
      </div>
      <div className="flex flex-col gap-y-2 ">
        <div className="font-bold text-xl ">Daftar Transaksi</div>
        <div className="border border-gray-300 rounded-lg flex flex-col gap-y-3 py-4 px-4 w-[820px] overflow-y-auto scrollbar-auto-hide h-[385px]">
          {isLoading ? (
            <div className="rounded-lg border border-gray-300 w-full h-36 py-3 px-3 flex flex-col item-center justify-center gap-y-5">
              {" "}
              <div className="bg-gray-400 animate-pulse h-2 w-[350px]" />
              <div className="bg-gray-400 animate-pulse h-2 w-[300px]" />
              <div className="bg-gray-400 animate-pulse h-2 w-[190px]" />
              <div className="bg-gray-400 animate-pulse h-2 w-[370px]" />
            </div>
          ) : !hasFetchedPurchase ? null : filterData.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              Belum ada Transaction
            </div>
          ) : (
            filterData?.map((product, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-300 w-full h-36 py-3 px-3 flex  justify-between"
              >
                <div className="flex flex-col gap-y-2">
                  <div className=" flex flex-row items-center gap-x-2">
                    <span className="font-bold text-sm">Belanja</span>
                    <span className="text-xs">
                      {getReadableDate(product.created_at)}
                    </span>
                    <span
                      className={`text-xs rounded min-w-16 h-5 px-2 flex items-center justify-center font-bold ${
                        product.status === "Diterima"
                          ? "text-green-500 bg-green-100"
                          : product.status === "Dalam pengiriman"
                          ? "text-orange-300 bg-orange-100"
                          : ""
                      }`}
                    >
                      {product.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {product.order_id}
                    </span>
                  </div>
                  <div className="flex flex-row gap-x-4">
                    <div className="flex flex-col">
                      <span className="font-bold flex flex-row gap-x-10">
                        {product.items.slice(0, 1).map((item, i) => (
                          <div
                            className="flex flex-col gap-x-2 gap-y-4"
                            key={i}
                          >
                            <div className="flex flex-row items-center gap-x-2">
                              {item?.image ? (
                                <Image
                                  src={item.image}
                                  alt="product image"
                                  className="rounded-lg object-cover w-10 border border-gray-300"
                                  width={200}
                                  height={200}
                                  loading="lazy"
                                />
                              ) : null}
                              <span>{item.name}</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {item.quantity} barang x{" "}
                              {formatRupiah(item.price)}
                            </span>
                          </div>
                        ))}

                        {product.items.length > 1 && (
                          <button
                            onClick={() => {
                              dispatch(setModalDetailTransaction(true));
                              setIdOrder(product.order_id);
                            }}
                            className="text-sm text-green-500 hover:underline mt-1 cursor-pointer"
                          >
                            + Lihat Detail Produk
                          </button>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center items-center flex-col w-1/3 h-full">
                  {product.status === "Dalam pengiriman" ? (
                    <div className=" w-full flex flex-col justify-center items-center h-full">
                      <span className="text-gray-500 text-xs mr-2">
                        Total Belanja
                      </span>
                      <span className="font-bold text-sm">
                        {formatRupiah(product.gross_amount)}
                      </span>

                      <button
                        onClick={() =>
                          router.push(
                            `/delivery?transaction_id=${product.order_id}`
                          )
                        }
                        className="bg-orange-300 rounded-lg w-36 cursor-pointer h-6 mt-2 text-xs font-bold text-white"
                      >
                        Live Tracking
                      </button>
                    </div>
                  ) : (
                    <div className="w-full flex justify-center items-center flex-col h-full">
                      <span className="text-gray-500 text-xs mr-2">
                        Total Belanja
                      </span>
                      <span className="font-bold text-sm">
                        {formatRupiah(product.gross_amount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {modalDetailTransaction && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-[9999]">
          <div className="w-[500px] h-[420px] flex flex-col items-center bg-white rounded-lg overflow-hidden">
            <div className="flex justify-between w-full p-4 border-b border-gray-200">
              <span className="text-sm font-bold">Detail Transaksi</span>
              <button
                onClick={() => dispatch(setModalDetailTransaction(false))}
                className=" text-gray-500 text-xl w-5 h-5 font-bold flex justify-center items-center cursor-pointer"
              >
                <MdClose />
              </button>
            </div>
            {purchaseProduct
              ?.filter((product) => product.order_id === idOrder)
              .map((product, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-y-2 w-full bg-white overflow-y-auto scrollbar-auto-hide "
                >
                  <div className="flex flex-row items-center gap-x-2 p-4 border-b-7 border-gray-100">
                    <span className="font-bold text-sm">Belanja</span>
                    <span className="text-xs">
                      {getReadableDate(product.created_at)}
                    </span>
                    <span
                      className={`text-xs rounded min-w-16 h-5 px-2 flex items-center justify-center font-bold ${
                        product.status === "Diterima"
                          ? "text-green-500 bg-green-100"
                          : product.status === "Dalam pengiriman"
                          ? "text-orange-300 bg-orange-100"
                          : ""
                      }`}
                    >
                      {product.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {product.order_id}
                    </span>
                  </div>
                  <div className="flex flex-row gap-x-4 ">
                    <span className="font-bold flex flex-col gap-x-10 w-full  ">
                      {product.items.map((item, i) => (
                        <div
                          className="flex flex-col gap-x-2 gap-y-2 bg-white p-4 border-b-7 border-gray-100"
                          key={i}
                        >
                          <div className="flex flex-row items-center gap-x-2">
                            {item?.image ? (
                              <Image
                                src={item.image}
                                alt="product image"
                                className="rounded-lg object-cover w-10 border border-gray-300"
                                width={200}
                                height={200}
                                loading="lazy"
                              />
                            ) : null}
                            <span>{item.name}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {item.quantity} barang x {formatRupiah(item.price)}
                          </span>
                        </div>
                      ))}
                      <div className="w-full flex justify-start items-center bg-white p-4">
                        <span className="pr-2">Total Belanja</span>
                        <span className="font-bold">
                          {formatRupiah(product.gross_amount)}
                        </span>
                      </div>
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
      {modal && <CartPage isOpen={true} />}
    </div>
  );
}
