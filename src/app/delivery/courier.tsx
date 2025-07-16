import { Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import { distance } from "@turf/turf";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/index";
import { RootState } from "@/store/index";
import { useSession } from "next-auth/react";
import { Session } from "next-auth";
import {
  fetchDeliveries,
  setConfirm,
  setIsNear,
} from "@/features/counter/counterSlice";
import { updateCourierPosition } from "@/lib/firebase/services";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import app from "@/lib/firebase/init";
import { useRouter, useSearchParams } from "next/navigation";

const firestore = getFirestore(app);

type Props = {
  routeCoords: [number, number][];
  destination: { lat: number; lon: number };
};

function findNearestIndex(
  coords: [number, number][],
  target: [number, number]
): number {
  let minDist = Infinity;
  let nearestIdx = 0;
  for (let i = 0; i < coords.length; i++) {
    const [rLat, rLon] = coords[i];
    const d = Math.abs(rLat - target[0]) + Math.abs(rLon - target[1]);
    if (d < minDist) {
      minDist = d;
      nearestIdx = i;
    }
  }
  return nearestIdx;
}

export default function Courier({ routeCoords, destination }: Props) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [startIndex, setStartIndex] = useState<number | null>(null);
  const [hasInitStarted, setHasInitStarted] = useState(false);
  const confirm = useSelector((state: RootState) => state.counter.confirm);

  const [isReady, setIsReady] = useState(false); // ⬅️ kunci!

  const dispatch = useDispatch<AppDispatch>();
  const { data: session } = useSession() as { data: Session | null };
  const delivery = useSelector((state: RootState) => state.counter.delivery);
  const isNear = useSelector((state: RootState) => state.counter.isNear);
  const searchParams = useSearchParams();
  const transaction_id = searchParams.get("transaction_id");

  const indexRef = useRef(0);
  const map = useMap();
  const transactionIdRef = useRef<string | null>(null);

  // Step 1: Ambil data delivery
  useEffect(() => {
    const email = session?.user?.email ?? null;

    if (email && transaction_id) {
      transactionIdRef.current = transaction_id;
      console.log("✅ transactionIdRef diisi dari URL:", transaction_id);

      dispatch(fetchDeliveries({ email, transaction_id }));
    }
  }, [dispatch, session?.user?.email, transaction_id]);

  // Step 2: Ambil posisi terakhir kurir dari Firestore
  useEffect(() => {
    if (hasInitStarted) return; // ⛔️ jangan ulangi
    if (!delivery.length || !routeCoords.length) return;

    const fetchLastPos = async () => {
      const docRef = doc(firestore, "couriers", delivery[0].transaction_id);
      const docSnap = await getDoc(docRef);
      const data = docSnap.data();

      const lat = data?.lat;
      const lon = data?.lon;

      console.log(lat, lon, "ZzZzZ");

      if (typeof lat === "number" && typeof lon === "number") {
        const firestorePos: [number, number] = [lat, lon];
        setPosition(firestorePos);

        const start = findNearestIndex(routeCoords, firestorePos);
        const matchedPoint = routeCoords[start];

        const distToRoute = distance(
          { type: "Point", coordinates: [firestorePos[1], firestorePos[0]] },
          { type: "Point", coordinates: [matchedPoint[1], matchedPoint[0]] },
          { units: "meters" }
        );

        console.log("📍 Start index:", start, "/", routeCoords.length - 1);
        console.log(
          "📏 Jarak ke rute terdekat:",
          distToRoute.toFixed(2),
          "meter"
        );

        if (start >= routeCoords.length - 1 || distToRoute < 100) {
          console.log(
            "📦 Kurir sudah di titik akhir / sangat dekat, tampilkan tombol"
          );
          setPosition(routeCoords[routeCoords.length - 1]);
          console.log(
            "📌 Marker akan ditaruh di:",
            routeCoords[routeCoords.length - 1]
          );

          dispatch(setIsNear(true));
          return;
        }

        setStartIndex(start);
        indexRef.current = start;
        setIsReady(true);
      } else {
        console.warn("❌ Posisi tidak valid:", data);
        setPosition(routeCoords[0]);
        setStartIndex(0);
        indexRef.current = 0;
        setIsReady(true);
      }
    };

    console.log("🚨 delivery:", delivery);
    console.log("🚨 routeCoords:", routeCoords);

    fetchLastPos();
    setHasInitStarted(true); // ⬅️ kunci agar tidak rerun!
  }, [delivery, routeCoords, hasInitStarted, dispatch]);

  // Step 3: Jalankan animasi hanya jika semua siap
  useEffect(() => {
    if (!isReady || startIndex === null || routeCoords.length === 0) return;

    const interval = setInterval(() => {
      if (indexRef.current >= routeCoords.length) {
        const lastPos = routeCoords[routeCoords.length - 1];
        const transactionId = transactionIdRef.current;

        if (!transactionId) {
          console.warn("Tidak ada transaction_id, update posisi gagal");
          return;
        }

        (async () => {
          try {
            await updateCourierPosition(
              delivery[0].transaction_id,
              lastPos[0],
              lastPos[1]
            );
            console.log("📍 Posisi terakhir berhasil disimpan ke Firestore");
          } catch (err) {
            console.error("❌ Gagal menyimpan posisi terakhir:", err);
          }
        })();

        clearInterval(interval);
        return;
      }

      const newPos = routeCoords[indexRef.current];
      setPosition(newPos);
      map.panTo(newPos);

      const dist = distance(
        { type: "Point", coordinates: [newPos[1], newPos[0]] },
        { type: "Point", coordinates: [destination.lon, destination.lat] },
        { units: "meters" }
      );

      dispatch(setIsNear(dist < 1000));
      indexRef.current++;
    }, 400);

    return () => clearInterval(interval);
  }, [isReady, startIndex, routeCoords, map, delivery, dispatch, destination]);

  const route = useRouter();

  const handleConfirm = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/confirmDelivery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transaction_id: delivery[0].transaction_id }),
    });

    alert("Barang sudah diterima");
    route.push("/product/purchase");
  };

  return (
    <>
      {position && (
        <Marker
          position={position}
          icon={L.icon({
            iconUrl: "/kurir.png",
            iconSize: [32, 32],
          })}
        />
      )}
      {isNear && (
        <div
          className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 shadow rounded z-[5]"
          style={{ zIndex: 999 }} //
        >
          <p className="text-center">Kurir sudah sampai!</p>
          <button
            onClick={() => dispatch(setConfirm(true))}
            className="bg-green-600 text-white px-3 py-1 rounded mt-1 cursor-pointer"
          >
            Konfirmasi Barang Diterima
          </button>
        </div>
      )}
      {confirm && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
          // style={{ zIndex: 1000 }}
        >
          <div className="bg-white rounded-lg p-5 shadow-md text-center flex flex-col gap-y-4 py-4 px-4 relative ">
            <span>Yakin sudah menerima Barang?</span>
            <div className="flex justify-center space-x-6">
              <button
                onClick={() => {
                  dispatch(setConfirm(false));
                  handleConfirm();
                }}
                className="bg-red-600 text-white px-4 py-2 rounded cursor-pointer"
              >
                Ya
              </button>
              <button
                onClick={() => {
                  dispatch(setConfirm(false));
                }}
                className="bg-red-600 text-white px-4 py-2 rounded cursor-pointer"
              >
                Tidak
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
