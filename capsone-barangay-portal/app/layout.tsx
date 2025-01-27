"use client";

import { usePathname } from 'next/navigation';
import TopNav from './(resident-side)/components/menu';
import Footer from './(resident-side)/components/footer';
import { AuthProvider } from './context/authContext';
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <html lang="en">
      <body className="">
        <AuthProvider> 
          <TopNav />
          {children}
          {/* Conditionally render Footer */}
          {pathname !== '/resident/login' && <Footer />}
        </AuthProvider>
      </body>
    </html>
  );
}