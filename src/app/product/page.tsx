"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import type { RootState } from "@/store/index";
import { useSelector, useDispatch } from "react-redux";
import {
  addToCartDB,
  addToCartLocal,
  cartDB,
  fetchProduct,
} from "@/features/counter/counterSlice";
import { Session } from "next-auth";
import type { AppDispatch } from "@/store/index";
import CartPage from "./cartPage";
import Image from "next/image";
import Link from "next/link";
interface Products {
  id: string;
  image: string;
  name: string;
  price: number;
  qty: number;
}

interface ProductCarts {
  id?: string;
  product_id: string;
  qty: number;
  user_id?: string;
}

export default function FetchProduct() {
  const [result, setResult] = useState<Products[]>([]);
  const dispatch = useDispatch<AppDispatch>();
  const { cart, products } = useSelector((state: RootState) => state.counter);
  const modal = useSelector((state: RootState) => state.counter.modal);
  const isLoading = useSelector((state: RootState) => state.counter.isLoading);

  const refLocalStorage = useRef(true);
  const refSyncCart = useRef(false);

  const { data: session, status } = useSession() as {
    data: Session | null;
    status: "authenticated" | "unauthenticated" | "loading";
  };

  useEffect(() => {
    dispatch(fetchProduct());
  }, [dispatch]);

  // useEffect(() => {
  //   const email = session?.user?.email ?? null;
  //   dispatch(fetchDeliveries(email));
  // }, [dispatch, session?.user?.email]);

  useEffect(() => {
    setResult(products);
  }, [products]);

  useEffect(() => {
    if (refLocalStorage.current) {
      refLocalStorage.current = false;
      return;
    }
    if (!session?.user?.email) {
      console.log("Saving cart to localStorage", cart);
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart, session]); // Simpan cart ke localStorage saat guest

  useEffect(() => {
    if (status !== "authenticated" || refSyncCart.current) return;

    const syncCart = async () => {
      const getItem = localStorage.getItem("cart");
      const result = getItem ? JSON.parse(getItem) : [];
      console.log(result);

      if (result.length > 0) {
        const cartWithUser = result.map((item: ProductCarts) => ({
          ...item,
          user_id: session?.user?.email,
        }));

        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/cart/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cartWithUser),
        });

        localStorage.removeItem("cart");
      }
      if (session?.user?.email) {
        dispatch(cartDB({ email: session.user.email }));
      }

      refSyncCart.current = true;
    };
    syncCart();
  }, [status, session, dispatch]); //ketika sudah login ngirim data yg ada di localstorage ke DB supaya sinkron

  const handleAddToCart = (item: ProductCarts) => {
    if (session?.user?.email) {
      // Login: kirim ke DB
      dispatch(
        addToCartDB({
          product_id: item.product_id,
          qty: 1,
          user_id: session.user.email,
        })
      ).then(() => {
        if (session?.user?.email) {
          dispatch(cartDB({ email: session.user.email }));
        }
      });
    } else {
      // Guest: simpan di redux dan localStorage
      dispatch(
        addToCartLocal({
          product_id: item.product_id,
          qty: 1,
        })
      );
    }
  };

  const formatRupiah = (number: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);

  return (
    <div className="flex flex-col justify-center items-center gap-y-3 h-screen pt-28">
      <div className="w-[1200px] h-full mt-2 px-5 mx-auto grid grid-cols-5 gap-x-10">
        {isLoading || !result ? (
          <div className="h-64 w-[500px] pl-3 flex flex-row gap-x-12 animate-pulse">
            <div className="flex flex-col gap-y-1">
              <div className="bg-gray-500 h-48 w-48 rounded-t-lg"></div>
              <div className="bg-gray-700 h-2 w-48"></div>
              <div className="bg-gray-700 h-4 w-48 rounded-b-lg"></div>
            </div>
            <div className="flex flex-col gap-y-1">
              <div className="bg-gray-500 h-48 w-48 rounded-t-lg"></div>
              <div className="bg-gray-700 h-2 w-48"></div>
              <div className="bg-gray-700 h-4 w-48 rounded-b-lg"></div>
            </div>
          </div>
        ) : (
          result.map((products, i) => (
            <div
              key={i}
              className="place-items-center h-64 w-56 text-center flex flex-col"
            >
              <Link href={`/product/${products.id}`}>
                <Image
                  src={products.image}
                  alt={"product image"}
                  className="rounded-lg object-cover h-48 border border-gray-300"
                  width={200}
                  height={200}
                  loading="lazy"
                />
                <div className="flex justify-between items-center gap-1 w-full pt-1.5 pb-1.5">
                  <span className="text-sm  truncate block w-[110px]">
                    {products.name}
                  </span>
                  <span className="text-sm font-bold whitespace-nowrap">
                    {formatRupiah(products.price)}
                  </span>
                </div>
              </Link>
              <button
                onClick={() =>
                  handleAddToCart({ product_id: products.id, qty: 1 })
                }
                disabled={products.qty < 1}
                className={`text-center font-bold text-white text-xs rounded-md h-6 w-20 ${
                  products.qty < 1
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-500 cursor-pointer"
                } `}
              >
                Add To Cart
              </button>
            </div>
          ))
        )}
      </div>
      {modal && <CartPage isOpen={true} />}
    </div>
  );
}
