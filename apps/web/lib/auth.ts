import { prisma } from "@workspace/db"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"

// Authentication only. Better Auth answers "who are you?"; it never decides what
// you may do — that is OpenFGA's job (see packages/authz).
export const auth = betterAuth({
  appName: "FGAC Reference",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: true,
  },
  advanced: {
    database: { joins: true },
  },
  session: {
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  // nextCookies must be the last plugin so Set-Cookie headers are applied.
  plugins: [nextCookies()],
})

export type AuthSession = typeof auth.$Infer.Session
