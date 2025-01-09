import TopNav from './components/menu';
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body className="">
       <TopNav />
      {children}
      </body>
    </html>
  );
}
