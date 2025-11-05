import type { Metadata } from "next";
import PODPortEditClient from "../edit/PODPortEditClient";

export const metadata: Metadata = {
  title: "Add POD Port | Vendor Booking Tool",
  description: "Create a new Port of Discharge (POD) port",
};

export default function PODPortAddPage() {
  return <PODPortEditClient />;
}

