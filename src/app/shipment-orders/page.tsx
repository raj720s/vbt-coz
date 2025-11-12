import type { Metadata } from "next";
import ShipmentOrderManager from "@/components/shared/shipment-order/ShipmentOrderManager";

export const metadata: Metadata = {
  title: "Shipment Orders | Vendor Booking Tool",
  description: "Manage vendor booking shipment orders and container assignments",
};

export default function ShipmentOrdersPage() {
  return <ShipmentOrderManager />;
}
