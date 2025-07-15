"use client";
import {
  addToCartLocal,
  cartDB,
  detailProduct,
} from "@/features/counter/counterSlice";
import { RootState } from "@/app/store/page";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { useParams } from "next/navigation";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/app/store/page";
import Image from "next/image";
import { AiOutlineLoading } from "react-icons/ai";

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
  const isLoading = useSelector((state: RootState) => state.counter.isLoading);

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

  return (
    <div className="flex justify-center h-full w-screen pt-28">
      {isLoading || !product ? (
        <AiOutlineLoading className="mt-36 text-9xl font-gray-300 text-green-500 rounded animate-spin" />
      ) : (
        <div className="flex justify-center gap-x-6 flex-row h-full w-[1200px] mt-2">
          <div>
            {product?.image && (
              <Image
                src={product.image}
                alt={"product image"}
                className="rounded-lg object-cover w-[310px] border border-gray-300"
                width={200}
                height={200}
                loading="lazy"
              />
            )}
          </div>
          <div className="flex flex-col items-left gap-y-2 w-[370px] ml-8 mr-8  ">
            <span className="text-3xl font-bold">
              {product?.price ? formatRupiah(product.price) : "-"}
            </span>
            <span className="font-bold">{product?.name || "No Name"}</span>
            <span>
              In e-commerce, capturing your audiences attention and converting
              visits into sales is paramount. A product description generator is
              important because it enables you to create unique, compelling
              descriptions that stand out. With e-commerce platforms becoming
              increasingly cluttered, having product descriptions that not only
              grab attention but also convincingly sell the benefits of your
              products can significantly impact your conversion rates.
            </span>
          </div>
          <div className="border  border-gray-300 rounded-xl min-h-96 w-64">
            <div className="flex flex-row px-4 py-4 gap-x-2">
              <div className="flex flex-row justify-between px-2 items-center border rounded-md border-gray-300 w-24 h-8 ">
                <button
                  disabled={tempQty <= 1}
                  onClick={() => setTempQty(tempQty - 1)}
                  className="text-3xl mb-1 cursor-pointer"
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
              <span className="text-md font-serif">
                Stock Total {product?.qty}
              </span>
            </div>
            <div className="font-bold py-4 px-4 flex flex-col w-full">
              <div className="flex justify-between">
                <span>Subtotal </span>
                <span>{formatRupiah(total)}</span>
              </div>
              <PayAndAddress TempQty={tempQty} />
            </div>
          </div>
        </div>
      )}

      {modal && <CartPage isOpen={true} />}
    </div>
  );
}
