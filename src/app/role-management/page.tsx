import RoleManagementClient from "./Client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Role Management",
  description: "Manage roles and permissions",
};

export default function RoleManagementPage() {
  return <RoleManagementClient />;
}