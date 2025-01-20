import TopNav from './components/menu';
import { AuthProvider } from './context/authContext';
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body className="">
       <AuthProvider> 
          <TopNav />
          {children}
       </AuthProvider>
      </body>
    </html>
  );
}
