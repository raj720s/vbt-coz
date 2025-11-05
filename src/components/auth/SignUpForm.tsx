"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  agreeToTerms: z.boolean().refine((val) => val === true, "You must agree to the terms and conditions"),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    clearErrors,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      agreeToTerms: false,
    },
  });

  const agreeToTerms = watch("agreeToTerms");

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    setServerError("");
    clearErrors();

    try {
      // Replace with your actual API call
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Registration failed");
      }

      toast.success("Account created successfully!");
      setTimeout(() => {
        router.push("/signin");
      }, 500);
    } catch (error: any) {
      console.error("Sign up error:", error);
      const errorMessage = error?.message || "An error occurred during registration. Please try again.";
      setServerError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm lg:w-96">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Vendor Booking Tool
        </h1>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Create your Vendor Account
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Get discovered by verified corporate clients.
        </p>
      </div>

          {/* Server Error Display */}
          {serverError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm">{serverError}</p>
              </div>
            </div>
          )}

          <div className="mt-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                {/* First Name and Last Name */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      First Name<span className="text-red-500 ml-1">*</span>
                    </Label>
                    <div className="mt-1">
                      <Input
                        type="text"
                        id="firstName"
                        placeholder="Enter First Name"
                        {...register("firstName")}
                        error={errors.firstName?.message}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last Name<span className="text-red-500 ml-1">*</span>
                    </Label>
                    <div className="mt-1">
                      <Input
                        type="text"
                        id="lastName"
                        placeholder="Enter Last Name"
                        {...register("lastName")}
                        error={errors.lastName?.message}
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email ID<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="mt-1">
                    <Input
                      type="email"
                      id="email"
                      autoComplete="email"
                      placeholder="Enter Email ID"
                      {...register("email")}
                      error={errors.email?.message}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="mt-1 relative">
                    <Input
                      placeholder="Enter password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="pr-10"
                      {...register("password")}
                      error={errors.password?.message}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeCloseIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    className="w-5 h-5 mt-0.5"
                    checked={agreeToTerms || false}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => 
                      setValue("agreeToTerms", event.target.checked)
                    }
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    I agree to the{" "}
                    <Link 
                      href="/terms" 
                      className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
                    >
                      Terms & Conditions
                    </Link>{" "}
                    and{" "}
                    <Link 
                      href="/privacy" 
                      className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
                    >
                      Privacy Policy
                    </Link>
                  </p>
                </div>
                {errors.agreeToTerms && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.agreeToTerms.message}
                  </p>
                )}

                {/* Submit Button */}
                <div>
                  <Button 
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg focus:ring-purple-500 focus:ring-2 focus:ring-offset-2 transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Account...
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>
              </div>
            </form>

            {/* Sign in link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <Link
                  href="/signin"
                  className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  Log in here
                </Link>
              </p>
            </div>
          </div>
        </div>
  );
}
