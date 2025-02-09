import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Barangay Fairview Portal",
  description:
    "A web-based management information system using React.js that enables residents to request documents and report " +
    "minor accidents online and enables officials to keep track of residents’ informations, requests, and reports. " +
    "With features such as AI chatbot, Heat map for incident tracking, SMS notification, automated document processing, and " +
    "data visualization",
};

interface RoleCheckerProps {
  children: React.ReactNode;
}

const RoleChecker: React.FC<RoleCheckerProps> = ({children }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
 
  useEffect(() => {
    if (status === "loading") return; // Wait until status is resolved
      if(session){
        router.push("/dashboard/accountSetup");
      }

  }, [status, router]);

  return( 
    <>
      {children}
    </>
  );
};

export default RoleChecker;
