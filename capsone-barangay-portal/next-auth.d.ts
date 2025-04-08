// next-auth.d.ts
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