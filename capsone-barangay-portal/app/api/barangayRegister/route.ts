import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/app/db/firebase";
import { collection, addDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userid, password, role, position, createdBy,  } = body;

    // ✅ Validate input
    if (!userid || !password || !role || !position || !createdBy) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    // ✅ Ensure only 'asst_sec' can create an account
    if (createdBy !== "asst_sec") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userCollection = collection(db, "BarangayUsers");
   
    // ✅ Hash the password
    const passwordHash = await hash(password, 10);

    // ✅ Store user in Firestore
    const docRef = await addDoc(userCollection, {
      userid,
      password: passwordHash,
      role,
      position,
      createdBy,
      createdAt: new Date().toISOString(),
      firstTimelogin: false,
    });

    return NextResponse.json({ message: "Barangay account created successfully", id: docRef.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create account", details: error.message || error },
      { status: 500 }
    );
  }
}
