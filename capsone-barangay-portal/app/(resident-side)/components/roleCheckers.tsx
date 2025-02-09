import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

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

  return <>{children}</>;
};

export default RoleChecker;
