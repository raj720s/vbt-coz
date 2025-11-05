import type { Metadata } from "next";
import POLPortEditClient from "./POLPortEditClient";

export const metadata: Metadata = {
  title: "Edit POL Port | Vendor Booking Tool",
  description: "Edit Port of Loading (POL) port information",
};

export default function POLPortEditPage() {
  return <POLPortEditClient />;
}

