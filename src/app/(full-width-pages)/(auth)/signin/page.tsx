import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Vendor Booking Tool",
  description: "Sign in to your Vendor Booking Tool account",
};

export default function SignIn() {
  return <SignInForm />;
}
