import type { Metadata } from "next";
import POLPortEditClient from "../edit/POLPortEditClient";

export const metadata: Metadata = {
  title: "Add POL Port | Vendor Booking Tool",
  description: "Create a new Port of Loading (POL) port",
};

export default function POLPortAddPage() {
  return <POLPortEditClient />;
}

