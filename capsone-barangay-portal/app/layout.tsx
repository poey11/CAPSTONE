"use client"
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
    
    return (
        <html>
            <body>
                <AuthProvider> 
                    <SessionProvider>
                        <TopNav />
                        <RoleChecker children={children}/>
                    </SessionProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
