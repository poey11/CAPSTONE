// app/dashboard/accountSetup/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { doc, collection, getDoc } from "firebase/firestore";
import { db } from "@/app/db/firebase";
import Form from "@/app/(barangay-side)/components/accSetupForm";

export default async function AccountSetupPage() {
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
    redirect("/dashboard");
    return null; 
  }

  return (
    <div>
      <h1>Account Setup</h1>
      <Form userID={userId} />
    </div>
  );
}
