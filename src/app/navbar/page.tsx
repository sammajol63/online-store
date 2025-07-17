"use client";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Session } from "next-auth";
import type { AppDispatch, RootState } from "@/store/index";
import { useDispatch, useSelector } from "react-redux";
import {
  cartDB,
  fetchProduct,
  setLogout,
  setModal,
} from "@/features/counter/counterSlice";
import { useEffect } from "react";
import { filterAvailableCart } from "@/lib/firebase/services";
import Image from "next/image";
import { LuShoppingCart } from "react-icons/lu";

export default function NavbarPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { cart, products } = useSelector((state: RootState) => state.counter);
  const productAvailable = filterAvailableCart(cart, products);
  const logout = useSelector((state: RootState) => state.counter.logout);

  const { data: session, status } = useSession() as {
    data: Session | null;
    status: "authenticated" | "unauthenticated" | "loading";
  };

  const imageUrl =
    session?.user.image && session.user.image !== "undefined"
      ? session.user.image
      : "/avatar.png";

  useEffect(() => {
    dispatch(fetchProduct());
  }, [dispatch]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      dispatch(cartDB({ email: session.user.email }));
    }
  }, [status, session?.user?.email, dispatch]);

  return (
    <div className="fixed top-0 left-0 bg-white w-full h-28 border-b border-b-gray-300 z-[9995]">
      <div className="w-[1200px] h-full mx-auto flex justify-between items-center gap-x-3">
        <div
          onClick={() => router.push("/")}
          className="font-bold text-center border w-28 cursor-pointer"
        >
          LOGO
        </div>

        <div className="flex items-center gap-x-3 h-9">
          <div className="relative">
            <LuShoppingCart
              onClick={() => dispatch(setModal(true))}
              className="text-black text-2xl cursor-pointer"
            />
            {productAvailable.length > 0 && (
              <span className="absolute -top-2.5 -right-2 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                {productAvailable.length}
              </span>
            )}
          </div>
          <span className="text-gray-300 font-bold">|</span>
          <div className="relative inline-block text-left group">
            {status === "loading" ? (
              <div className="h-10 flex items-center justify-center">
                <span className="inline-block pt-4 cursor-pointer animate-pulse w-24 h-4 bg-gray-500" />
              </div>
            ) : !session ? (
              <div className="cursor-pointer bg-gray-300 w-24 animate-pulse">
                Guest
              </div>
            ) : (
              <button className="cursor-pointer">{session.user?.name}</button>
            )}
            <div className="flex justify-center py-2 px-3 gap-y-2 items-center flex-col absolute left-0 w-[400px] -translate-x-[330px] bg-white border border-gray-300 rounded shadow-lg opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-opacity duration-200">
              <div className="border border-gray-300 w-full h-10 rounded flex items-center justify-center text-center gap-x-2">
                <span>
                  <Image
                    className="w-6 rounded-full"
                    src={imageUrl}
                    alt="Picture of the author"
                    width={50}
                    height={50}
                    priority
                  />
                </span>
                <span className="font-bold">{session?.user?.name}</span>
              </div>
              <div
                onClick={() => router.push("/product/purchase")}
                className="px-4 py-2 mb-10 w-full text-center hover:bg-gray-100 cursor-pointer"
              >
                <span className="text-gray-700">Pembelian</span>
              </div>
              <button
                onClick={() => {
                  dispatch(setLogout(true));
                }}
                className="bg-gray-500 text-white rounded-sm h-6 w-24 cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
      {logout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-5 shadow-md text-center flex flex-col gap-y-4 py-8 px-10">
            <span>Anda ingin Logout?</span>
            <div className="flex justify-center space-x-6">
              <button
                onClick={() => {
                  dispatch(setLogout(false));
                  signOut({ callbackUrl: "/login" });
                }}
                className="bg-red-600 text-white px-4 py-2 text-sm rounded cursor-pointer"
              >
                Yes
              </button>
              <button
                onClick={() => {
                  dispatch(setLogout(false));
                }}
                className="bg-gray-400 text-white px-4 py-2 text-sm rounded cursor-pointer"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
