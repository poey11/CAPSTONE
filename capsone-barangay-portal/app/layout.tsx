import TopNav from './(resident-side)/components/menu';
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthProvider } from './context/authContext';
import "./globals.css";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const barangayToken = cookieStore.get("barangayToken");
  if(barangayToken){
      redirect("/dashboard");
  }
  else{
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
 
}
