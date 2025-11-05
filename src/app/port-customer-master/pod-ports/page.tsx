import type { Metadata } from "next";
import { PodDataManager } from "@/components/shared/master-data";

export const metadata: Metadata = {
  title: "POD Master | Vendor Booking Tool",
  description: "Manage Port of Discharge ports for container shipments",
};

export default function PODPortsPage() {
  return <PodDataManager />;
}