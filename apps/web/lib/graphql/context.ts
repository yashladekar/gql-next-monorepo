import { prisma, type PrismaClient } from "@workspace/db"
import { userSubject } from "@workspace/authz"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { ForbiddenError } from "@workspace/authz"

export type GraphQLContext = {
  prisma: PrismaClient
  userId: string | null
  /** OpenFGA subject, e.g. "user:user_alice", or null when unauthenticated. */
  subject: string | null
  user: { id: string; name: string; email: string; image: string | null } | null
}

export function forbid(message = "You do not have permission to perform this action."): never {
  throw new ForbiddenError(message)
}

export async function createContext(): Promise<GraphQLContext> {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id ?? null
  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }
    : null

  return {
    prisma,
    userId,
    subject: userId ? userSubject(userId) : null,
    user,
  }
}
