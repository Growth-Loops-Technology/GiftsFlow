import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Email/Password Login
    CredentialsProvider({
      id: "login",
      name: "Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          throw new Error("User not found");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password || ""
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger, session }: any) {
      // On initial sign in with OAuth or credentials
      if (user) {
        token.id = user.id;
        // For OAuth users, fetch role from database
        if (account?.provider !== "credentials") {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
          });
          token.role = dbUser?.role || "CUSTOMER";
        } else {
          token.role = (user as any).role || "CUSTOMER";
        }
      }
      
      // On token refresh or session update
      if (!user && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
        });
        if (dbUser) {
          token.role = dbUser.role;
        }
      }
      
      if (trigger === "update" && session) {
        return { ...token, ...session };
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role || "CUSTOMER";
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

export default NextAuth(authOptions);

