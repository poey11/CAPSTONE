import TopNav from './(resident-side)/components/menu';

import { AuthProvider } from './context/authContext';
import "./globals.css";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    
    return (
        <html>
            <body>
                <AuthProvider> 
                    <TopNav />
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
