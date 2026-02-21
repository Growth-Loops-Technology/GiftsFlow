import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: "CUSTOMER" | "VENDOR" | "ADMIN";
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "CUSTOMER" | "VENDOR" | "ADMIN";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "CUSTOMER" | "VENDOR" | "ADMIN";
  }
}
