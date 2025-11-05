import { Outfit } from 'next/font/google';
import './globals.css';
import { Metadata } from 'next';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'; 

import { ReduxProvider } from '@/components/providers/ReduxProvider';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { MessageProvider } from '@/components/ui/MessageBox';
import AuthWrapper from '@/components/auth/AuthWrapper';
import ConditionalLayout from '@/components/layout/ConditionalLayout';
import { GlobalErrorHandler } from '@/components/providers/GlobalErrorHandler';

export const metadata: Metadata = {
  title: 'Vendor Booking Tool',
  description: 'Streamline your vendor booking and management process with our comprehensive booking tool',
};

const outfit = Outfit({
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} bg-gray-25 dark:bg-gray-900 min-h-screen`}>
        <ReduxProvider>
          <AuthProvider>
            <ThemeProvider>
              <MessageProvider>
                <GlobalErrorHandler />
                {/* <AuthWrapper> */}
                  <ConditionalLayout>
                    {children}
                  </ConditionalLayout>
                {/* </AuthWrapper> */}
              </MessageProvider>
            </ThemeProvider>
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}