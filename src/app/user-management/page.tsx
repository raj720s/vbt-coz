import UserManagementClient from "./Client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Management",
  description: "Manage users and permissions",
};

export default function UserManagementPage() {
  return <UserManagementClient />;
}