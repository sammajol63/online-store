import midtransClient from "midtrans-client";

export function initMidtrans() {
  return new midtransClient.Snap({
    isProduction: false, // Ubah ke true saat produksi
    serverKey: process.env.MIDTRANS_SERVER_KEY as string,
    // clientKey: process.env.MIDTRANS_CLIENT_KEY as string,
  });
}
