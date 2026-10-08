import { prisma } from "@workspace/db"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"

// Authentication only. Better Auth answers "who are you?"; it never decides what
// you may do — that is OpenFGA's job (see packages/authz).
//
// Shared by every app in the workspace so a session issued by one app is
// accepted by the others (cookies are host-scoped, not port-scoped).
export const auth = betterAuth({
  appName: "FGAC Reference",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    "http://localhost:3001",
    "http://localhost:3003",
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
  ],
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  user: {
    // Surfaced on the session user so Better Auth Studio can decide access by
    // role. `input: false` keeps it out of client-supplied payloads; it is set
    // by the seed (and would be by an admin flow).
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "member",
        input: false,
      },
    },
  },
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
