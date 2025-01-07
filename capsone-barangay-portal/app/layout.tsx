import type { Metadata } from "next";
import TopNav from './components/menu';
import "./globals.css";

export const metadata: Metadata = {
  title: "Barangay Fairview Portal",
  description:  
  "A web-based management information system using React.js that enables residents to request documents and report " +  
  "minor accidents online and enables officials to keep track of residents’ informations, requests, and reports. " +
  "With features such as AI chatbot, Heat map for incident tracking, SMS notification, automated document processing, and " +
  "data visualization"
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-200">
        <TopNav />
        {children}
      </body>
    </html>
  );
}
