"use client";
import { usePathname } from 'next/navigation';
import Footer from './(resident-side)/components/footer';
import { SessionProvider } from 'next-auth/react';
import TopNav from './(resident-side)/components/menu';
import { AuthProvider } from './context/authContext';
import RoleChecker from './(resident-side)/components/roleCheckers';
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
            <SessionProvider>
              <TopNav />
              <RoleChecker children={children}/>
              {/* Conditionally render Footer */}
              {pathname !== '/official/login' && pathname !== '/resident/login' && <Footer />}
            </SessionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
    
  