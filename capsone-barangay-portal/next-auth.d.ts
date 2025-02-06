// next-auth.d.ts
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      position: string;
      firstTimeLogin: boolean;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    position: string;
    firstTimeLogin: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name: string;
    email: string;
    role: string;
    position: string;
    firstTimeLogin: boolean;
  }
}