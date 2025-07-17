"use client";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function Login() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("callbackUrl");
  const callbackUrl = raw?.startsWith("/") ? raw : "/product";

  return (
    <div className="h-screen flex justify-center items-center bg-gray-200">
      <div className="bg-white h-96 w-1/4 flex flex-col items-center py-4">
        <h1>Login</h1>
        <div>
          <button
            type="button"
            onClick={() => {
              console.log("callbackUrl:", callbackUrl);
              signIn("google", { callbackUrl });
            }}
            className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Login With Google
          </button>
        </div>
      </div>
    </div>
  );
}
