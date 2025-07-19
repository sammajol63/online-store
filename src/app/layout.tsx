import "./globals.css";
import { AppProviders } from "./providers";
import LayoutClient from "./layoutClient";

export const metadata = {
  title: "Toko Online",
  description: "Belanja Sepuasnya",
  viewport: "width=device-width, initial-scale=1.0",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <LayoutClient>{children}</LayoutClient>
        </AppProviders>
      </body>
    </html>
  );
}
