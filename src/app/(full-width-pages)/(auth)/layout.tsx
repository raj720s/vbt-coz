import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import { ThemeProvider } from "@/context/ThemeContext";
import Image from "next/image";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <ThemeProvider>
        <div className="flex min-h-screen">
          {/* Left Side - Auth Form */}
          <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
            {children}
          </div>

          {/* Right Side - Promotional Content */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-900 via-purple-800 to-purple-950 relative w-full overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white/20 rounded-full"></div>
              <div className="absolute top-32 right-16 w-24 h-24 border-2 border-white/20 rounded-full"></div>
              <div className="absolute bottom-20 left-20 w-40 h-40 border-2 border-white/20 rounded-full"></div>
              <div className="absolute bottom-32 right-32 w-16 h-16 border-2 border-white/20 rounded-full"></div>
            </div>

            {/* Main Content with Two Flex Containers */}
            <div className="relative z-10 flex flex-col justify-end items-end h-screen w-full">
              <div className="max-w-full w-full">
                {/* Top Flex Container - Header and First Image */}

                <div className="flex items-center justify-end  mb-6">
                  <div className="xl:ml-[10rem] self-center">
                    <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight">
                      Your <span className="text-purple-300">Vendor Booking</span> Journey Starts Here
                    </h1>
                  </div>
                  <div className=" self">
                    <Image
                      src="/assets/Button container.png"
                      alt="Security"
                      width={500}
                      height={300}
                      className="w-[30rem] h-full object-fill"
                    />
                  </div>
                </div>

                {/* Bottom Flex Container - Two Images */}
                <div className="flex items-end justify-end gap-6   pl-10">
                  <div className="flex-shrink-1">
                    <Image
                      src="/assets/Vertical container.png"
                      alt="Logistics"
                      width={300}
                      height={500}
                      className=""
                    />
                  </div>
                  <div className="flex-shrink-1 flex flex-col items-end">
                    <Image
                      src="/assets/Container.png"
                      alt="IT Services"
                      width={400}
                      height={500}
                      className=""
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
