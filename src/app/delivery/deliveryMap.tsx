"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import polyline from "@mapbox/polyline";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Courier from "./courier";

delete (
  L.Icon.Default.prototype as unknown as {
    _getIconUrl?: () => string;
  }
)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

type Props = {
  origin: { lat: number; lon: number }; // lokasi toko
  destination: { lat: number; lon: number }; // lokasi pembeli
};

function MapController({
  center,
  origin,
  destination,
  setRouteCoords,
}: {
  center: [number, number];
  origin: { lat: number; lon: number };
  destination: { lat: number; lon: number };
  setRouteCoords: React.Dispatch<React.SetStateAction<[number, number][]>>;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, 13); // Set peta ke tengah
  }, [center, map]);

  useEffect(() => {
    async function fetchRoute() {
      const res = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${process.env.NEXT_PUBLIC_OPEN_ROUTE_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            coordinates: [
              [origin.lon, origin.lat],
              [destination.lon, destination.lat],
            ],
          }),
        }
      );
      const data = await res.json();
      if (!data.routes || data.routes.length === 0) {
        console.error("No routes found");
        return;
      }

      const encoded = data.routes[0].geometry;
      const decoded = polyline.decode(encoded);
      const coords: [number, number][] = decoded.map((coord: number[]) => [
        coord[0],
        coord[1],
      ]);

      setRouteCoords(coords);
    }

    fetchRoute();
  }, [origin, destination, setRouteCoords]);

  return null;
}

export default function DeliveryMap({ origin, destination }: Props) {
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const center: [number, number] = [origin.lat, origin.lon];

  return (
    <div style={{ height: "600px", width: "100%" }}>
      <MapContainer style={{ height: "100%", width: "100%" }}>
        <MapController
          center={center}
          origin={origin}
          destination={destination}
          setRouteCoords={setRouteCoords}
        />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Marker position={[origin.lat, origin.lon]}>
          <Popup>Toko</Popup>
        </Marker>

        <Marker position={[destination.lat, destination.lon]}>
          <Popup>Pemesan</Popup>
        </Marker>

        {routeCoords.length > 0 && (
          <>
            <Polyline positions={routeCoords} color="blue" />
            <Courier routeCoords={routeCoords} destination={destination} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
