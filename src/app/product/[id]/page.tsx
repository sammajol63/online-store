"use client";
import {
  addToCartLocal,
  cartDB,
  detailProduct,
} from "@/features/counter/counterSlice";
import { RootState } from "@/store";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { setTempQuantity } from "@/features/counter/counterSlice";

import { useParams } from "next/navigation";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import Image from "next/image";

import PayAndAddress from "@/app/buttonPay/page";
import CartPage from "../cartPage";
import { useSession } from "next-auth/react";
import { Session } from "next-auth";

interface ProductCarts {
  id?: string;
  product_id: string;
  qty: number;
  user_id?: string;
}

export default function DetailProduct() {
  const params = useParams();
  const id = params.id;
  const modal = useSelector((state: RootState) => state.counter.modal);
  const [total, setTotal] = useState(0);
  const [tempQty, setTempQty] = useState(1);
  const isLoading = useSelector(
    (state: RootState) => state.counter.isLoadingProductDetail
  );

  const dispatch = useDispatch<AppDispatch>();
  const product = useSelector(
    (state: RootState) => state.counter.detailProduct
  );
  const { data: session, status } = useSession() as {
    data: Session | null;
    status: "authenticated" | "unauthenticated" | "loading";
  };
  const refSynced = useRef(false);

  useEffect(() => {
    if (refSynced.current) return; // kalau sudah sync, jangan sync lagi

    if (status === "loading") return; // tunggu status selesai
    refSynced.current = true; // tandai sudah sync

    if (status === "authenticated" && session?.user?.email) {
      dispatch(cartDB({ email: session.user.email }));
    } else {
      // guest: load dari localStorage kalau belum di-restore
      const getItem = localStorage.getItem("cart");
      console.log("LocalStorage cart content:", getItem);

      if (getItem) {
        const parsedCart = JSON.parse(getItem);
        if (parsedCart.length > 0) {
          console.log("Dispatching cart items to Redux");
          // Dispatch isi cart ke Redux
          parsedCart.forEach((item: ProductCarts) => {
            dispatch(
              addToCartLocal({
                product_id: item.product_id,
                qty: item.qty,
              })
            );
          });
        }
      }
    }
  }, [status, session, dispatch]);

  const formatRupiah = (number: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);

  useEffect(() => {
    if (product) {
      const result = product.price * tempQty;
      setTotal(result);
    }
  }, [product, tempQty]);

  useEffect(() => {
    if (typeof id === "string") {
      dispatch(detailProduct(id));
    } else {
      console.error("Invalid id format:", id);
    }
  }, [id, dispatch]);

  useEffect(() => {
    dispatch(setTempQuantity(tempQty));
  }, [tempQty, dispatch]);

  return (
    <div className="flex justify-center h-full w-full pt-28">
      {isLoading || !product ? (
        <div className="w-full max-w-[1200px] h-full flex justify-center pt-10">
          <div className="h-full w-[300px] flex flex-col gap-y-1.5 rounded-lg  bg-white animate-pulse">
            <div className="bg-gray-300 w-[300px] rounded-t-lg h-[250px]" />
            <div className="bg-gray-500 w-[300px] h-[10px]" />
            <div className="bg-gray-300 w-[300px] rounded-b-lg h-[30px]" />
          </div>
        </div>
      ) : (
        <div className="flex justify-center gap-x-6 xl:flex-row flex-col h-full max-w-[1200px] w-full mx-auto xl:mt-2">
          <div
            className="flex flex-col justify-center items-center 
                xl:flex-row xl:justify-start xl:items-start 
                w-full gap-x-4 xl:gap-x-12 gap-y-4 py-0 xl:gap-y-0"
          >
            {" "}
            {product?.image && (
              <Image
                src={product.image}
                alt="product image"
                className="xl:rounded-lg xl:object-contain object-cover xl:w-[310px] w-full h-[300px] xl:h-[400px] xl:border border-gray-300 xl:bg-white"
                width={310}
                height={200}
                loading="lazy"
              />
            )}
            <div className="flex flex-col px-6 xl:px-0 items-left gap-y-2 w-full xl:w-[370px]">
              <span className="text-3xl font-bold">
                {product?.price ? formatRupiah(product.price) : "-"}
              </span>
              <span className="font-bold">{product?.name || "No Name"}</span>
              <span>
                In e-commerce, capturing your audiences attention and converting
                visits into sales is paramount. A product description generator
                is important because it enables you to create unique, compelling
                descriptions that stand out. With e-commerce platforms becoming
                increasingly cluttered, having product descriptions that not
                only grab attention but also convincingly sell the benefits of
                your products can significantly impact your conversion rates.
              </span>
            </div>
          </div>

          <div className="flex justify-center items-center">
            <div className="flex flex-col gap-y-2 xl:border xl:bg-white border-gray-300 rounded-lg h-full xl:min-h-96 w-full xl:w-64">
              <div className="flex flex-row px-6 xl:px-4 py-4 gap-x-2 border-b-[6px] border-b-gray-100 xl:border-b-0">
                <div className="flex flex-row justify-between items-center px-2 border rounded-md border-gray-300 w-24 h-8">
                  <button
                    disabled={tempQty <= 1}
                    onClick={() => setTempQty(tempQty - 1)}
                    className="text-3xl cursor-pointer"
                  >
                    -
                  </button>
                  <span className="">{tempQty}</span>
                  <button
                    disabled={!!product && tempQty >= product?.qty}
                    onClick={() => setTempQty(tempQty + 1)}
                    className="text-2xl  cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <span className="text-md font-serif flex justify-between items-center px-2">
                  Stock Total {product?.qty}
                </span>
              </div>
              <div className=" font-bold py-4 px-6 xl:px-4 flex bg-white flex-col w-full">
                <div className="flex xl:justify-between gap-x-3 xl:gap-x-0">
                  <span>Subtotal </span> <span>{formatRupiah(total)}</span>
                </div>
                <div className="w-full flex justify-baseline xl:justify-center">
                  <PayAndAddress />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal && <CartPage isOpen={true} />}
    </div>
  );
}
