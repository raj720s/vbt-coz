import type { Metadata } from "next";
import UserEditClient from "./UserEditClient";

export const metadata: Metadata = {
  title: "Edit User | Vendor Booking Tool",
  description: "Update user information",
};

export default function UserEditPage() {
  return <UserEditClient />;
}


