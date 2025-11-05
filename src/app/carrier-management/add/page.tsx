import type { Metadata } from "next";
import CarrierEditClient from "../edit/CarrierEditClient";

export const metadata: Metadata = {
  title: "Add Carrier | Vendor Booking Tool",
  description: "Create a new carrier",
};

export default function CarrierAddPage() {
  return <CarrierEditClient />;
}


