"use client";

import { usePathname } from "next/navigation";
import NavbarPage from "../app/navbar/page";

const disableNavbar = ["/login"];

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathName = usePathname();

  return (
    <>
      {!disableNavbar.includes(pathName) && <NavbarPage />}
      {children}
    </>
  );
}
