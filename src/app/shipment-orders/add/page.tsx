import type { Metadata } from "next";
import ShipmentOrderEditClient from "../edit/ShipmentOrderEditClient";

export const metadata: Metadata = {
  title: "Add Shipment Order | Vendor Booking Tool",
  description: "Create a new shipment order",
};

export default function ShipmentOrderAddPage() {
  return <ShipmentOrderEditClient />;
}

