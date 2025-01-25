import TopNav from './(resident-side)/components/menu';
import Footer from './(resident-side)/components/footer'
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
          <Footer />
       </AuthProvider>
      </body>
    </html>
  );
}
