import type { Metadata } from "next";
import UserEditClient from "../edit/UserEditClient";

export const metadata: Metadata = {
  title: "Add User | Vendor Booking Tool",
  description: "Create a new user",
};

export default function UserAddPage() {
  return <UserEditClient />;
}


