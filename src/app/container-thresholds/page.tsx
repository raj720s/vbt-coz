import type { Metadata } from "next";
import { ContainerThresholdsManager } from "@/components/shared/master-data/ContainerThresholdsManager";

export const metadata: Metadata = {
  title: "Container Thresholds | Vendor Booking Tool",
  description: "Manage container capacity thresholds and constraints",
};

function ContainerThresholdsPage() {
  return <ContainerThresholdsManager mode="admin" />;
}

export default ContainerThresholdsPage;
