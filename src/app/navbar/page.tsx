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
import { useEffect, useRef, useState } from "react";
import { filterAvailableCart } from "@/lib/firebase/services";
import Image from "next/image";
import { LuShoppingCart } from "react-icons/lu";

export default function NavbarPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { cart, products } = useSelector((state: RootState) => state.counter);
  const productAvailable = filterAvailableCart(cart, products);
  const logout = useSelector((state: RootState) => state.counter.logout);
  const [open, setOpen] = useState(false);
  const [hovering, setHovering] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      <div className="max-w-[1200px] px-2 xl:px-0 w-full h-full mx-auto flex justify-between items-center gap-x-3">
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
              <div
                ref={dropdownRef}
                className="relative inline-block text-left"
              >
                <div
                  onClick={() => setOpen((prev) => !prev)}
                  onMouseEnter={() => setHovering(true)}
                  onMouseLeave={() => setHovering(false)}
                  className="cursor-pointer flex items-center gap-2 px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 transition"
                >
                  <span className="font-medium">{session?.user?.name}</span>
                </div>

                {/* Dropdown */}

                <div
                  onMouseEnter={() => setHovering(true)}
                  onMouseLeave={() => setHovering(false)}
                  className={`absolute left-0 mt-0.5 w-[350px] md:w-[400px] -translate-x-[250px] md:-translate-x-[300px] bg-white border border-gray-300 rounded shadow-lg z-50 p-4 flex flex-col items-center gap-3 transition-all duration-200 ${
                    open || hovering
                      ? "opacity-100 visible"
                      : "opacity-0 invisible"
                  }`}
                >
                  <div className="border border-gray-300 w-full h-10 rounded flex items-center justify-center text-center gap-x-2">
                    <Image
                      className="w-6 rounded-full"
                      src={imageUrl}
                      alt="User"
                      width={50}
                      height={50}
                      priority
                    />
                    <span className="font-bold">{session?.user?.name}</span>
                  </div>

                  <div
                    onClick={() => {
                      router.push("/product/purchase");
                      setOpen(false);
                      setHovering(false);
                    }}
                    className="px-4 py-2 mb-2 w-full text-center hover:bg-gray-100 cursor-pointer"
                  >
                    <span className="text-gray-700">Pembelian</span>
                  </div>

                  <button
                    onClick={() => dispatch(setLogout(true))}
                    className="bg-gray-500 text-white rounded-sm h-6 w-24 cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
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
