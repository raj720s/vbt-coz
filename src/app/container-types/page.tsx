import type { Metadata } from "next";
import { ContainerTypesManager } from "@/components/shared/master-data/ContainerTypesManager";


export const metadata: Metadata = {
  title: "Container Type Master | Vendor Booking Tool",
  description: "Manage container types and their configurations",
};

function ContainerTypesPage() {
  return <ContainerTypesManager mode="admin" />;
}



export default ContainerTypesPage;