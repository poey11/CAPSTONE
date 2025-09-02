"use client";
import { usePathname } from 'next/navigation';
import Footer from './(resident-side)/components/footer';
import { SessionProvider } from 'next-auth/react';
import TopNav from './(resident-side)/components/menu';
import { AuthProvider } from './context/authContext';
import RoleChecker from './(resident-side)/components/roleCheckers';
import Chatbot from './(resident-side)/components/chatbot';
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname() ?? "";

  // normalize (optional): remove trailing slash except for root
  const normalized = pathname === "/" ? "/" : pathname.replace(/\/$/, "");

  const residentRoutes = [
    "/aboutus",
    "/Announcements",
    "/IncidentReport",
    "/official",
    "/OfficialsPage",
    "/Programs",
    "/register",
    "/resident",
    "/ResidentAccount",
    "/services"
  ];

  const isHome = normalized === "/";
  const isOtherResident = residentRoutes.some((route) => normalized.startsWith(route));

  const isResidentSide = isHome || isOtherResident;


  return (
    <html lang="en">
      <body className="">
        <AuthProvider> 
            <SessionProvider>
              <TopNav />
              <RoleChecker children={children}/>

             {/* show only on resident-side (exact root OR any resident route) */}
            {isResidentSide && <Chatbot />}

            {normalized !== "/official/login" && normalized !== "/resident/login" && <Footer />}
            </SessionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
    
  