// next-auth.d.ts
import { Timestamp } from "firebase/firestore";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      role: string;
      position: string;
      loginStatus: boolean;
      fullName: string;
      department: string;
      profileImage: string;
      createdAt: Timestamp;

    };
  }

  interface User {
    id: string;
    name: string;
    role: string;
    position: string;
    loginStatus: boolean;
    fullName: string;
    department: string;
    profileImage: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name: string;
    role: string;
    position: string;
    loginStatus: boolean;
    fullName: string;
    department: string;
    profileImage: string;
  }
}