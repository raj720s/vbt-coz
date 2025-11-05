import type { Metadata } from "next";
import CarrierEditClient from "./CarrierEditClient";

export const metadata: Metadata = {
  title: "Edit Carrier | Vendor Booking Tool",
  description: "Update carrier information",
};

export default function CarrierEditPage() {
  return <CarrierEditClient />;
}


