import type { Metadata } from "next";
import PODPortEditClient from "./PODPortEditClient";

export const metadata: Metadata = {
  title: "Edit POD Port | Vendor Booking Tool",
  description: "Update Port of Discharge (POD) port information",
};

export default function PODPortEditPage() {
  return <PODPortEditClient />;
}

