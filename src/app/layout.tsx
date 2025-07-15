"use client";
import { usePathname } from "next/navigation";
import "./globals.css";
import { AppProviders } from "./providers";
import NavbarPage from "./navbar/page";
const disableNavbar = ["/login"];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathName = usePathname();

  return (
    <html lang="en">
      <body>
        <AppProviders>
          {!disableNavbar.includes(pathName) && <NavbarPage />}
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
