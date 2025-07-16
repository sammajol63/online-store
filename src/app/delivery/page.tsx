"use client";

import { Suspense } from "react";
import DeliveryContent from "./deliveryContent";

export default function DeliveryPage() {
  return (
    <Suspense fallback={<div>Loading delivery...</div>}>
      <DeliveryContent />
    </Suspense>
  );
}
