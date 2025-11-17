import type { Metadata } from "next";
import ShipmentOrderEditClient from "./ShipmentOrderEditClient";

export const metadata: Metadata = {
  title: "Edit Shipment Order | Vendor Booking Tool",
  description: "Edit shipment order information",
};

export default function ShipmentOrderEditPage() {
  return <ShipmentOrderEditClient />;
}

