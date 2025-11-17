import type { Metadata } from "next";
import CompanyCustomerMappingManager from "@/components/shared/master-data/CompanyCustomerMappingManager";

export const metadata: Metadata = {
  title: "Company Customer Mappings | Vendor Booking Tool",
  description: "Manage mappings between companies and customers",
};

export default function CompanyCustomerMappingsPage() {
  return <CompanyCustomerMappingManager />;
}

