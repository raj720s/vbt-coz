import ContainerPriorityManager from "@/components/shared/master-data/ContainerPriorityManager";
import type { Metadata } from "next";
// import ContainerPriorityPage from "./ContainerPriorityClient";


export const metadata: Metadata = {
  title: "Container Priority Master | Vendor Booking Tool",
  description: "Manage container priority and their configurations",
};

function ContainerPriorityPageComponent() {
  return <ContainerPriorityManager />;
}

export default ContainerPriorityPageComponent;