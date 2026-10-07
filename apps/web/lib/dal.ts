import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"
import { auth } from "./auth"

// Data Access Layer for authentication. Memoized per React render pass so the
// session is resolved once per request.
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() })
})

export const requireSession = cache(async () => {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  return session
})

export const getCurrentUser = cache(async () => {
  const session = await getSession()
  if (!session) return null
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image ?? null,
  }
})
