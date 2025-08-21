// app/dashboard/accountSetup/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/lib/auth";
import { doc, collection, getDoc } from "firebase/firestore";
import { db } from "@/app/db/firebase";
import Form from "@/app/(barangay-side)/components/accSetupForm";

// interface AccountSetupPageProps {
//   searchParams: { [key: string]: string | string[] | undefined } | Promise<{ [key: string]: string | string[] | undefined }>;
// }


export default async function AccountSetupPage({searchParams}: any) {
  const params = await searchParams;
  const returnUrl = (params.returnUrl as string) || "/dashboard";
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
    return null;
  }

  const userId = session.user.id;
  const userDocRef = doc(collection(db, "BarangayUsers"), userId);
  const userDoc = await getDoc(userDocRef);
  const userData = userDoc.data();

  if (!userData?.firstTimelogin) {
    console.log(returnUrl);
    redirect(returnUrl);
    return null;
  }
  return (
  
      <Form userID={userId} />
  
  );
}
