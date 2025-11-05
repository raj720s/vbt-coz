import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | Vendor Booking Tool",
  description: "Create your Container Management System account",
  // other metadata
};

export default function SignUp() {
  return <SignUpForm />;
}
