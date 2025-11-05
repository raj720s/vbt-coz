import ShipmentUploadManager from "@/components/shared/operations/ShipmentUploadManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipment Upload",
  description: "Upload shipments for container load planning",
};

export default function ShipmentUploadPage() {
  return <ShipmentUploadManager />;
}
