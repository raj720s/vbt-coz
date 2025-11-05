import type { Metadata } from "next";
import { PolDataManager } from "@/components/shared/master-data";

export const metadata: Metadata = {
  title: "POL Master | Vendor Booking Tool", 
  description: "Manage Port of Loading (POL) ports and their configurations",
};

export default function POLPortsPage() {
  return <PolDataManager />;
}