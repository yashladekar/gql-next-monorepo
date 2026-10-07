import ScopeAuthPlugin from "@pothos/plugin-scope-auth"
import SchemaBuilder from "@pothos/core"
import { check, type Permission } from "@workspace/authz"
import type { GraphQLContext } from "./context"

export type PermissionScope = { permission: Permission; resourceId: string }

/**
 * Every GraphQL field that touches protected data declares the permission it
 * needs via `authScopes`. The scope is evaluated by OpenFGA before the resolver
 * runs, so a denied request never reaches Prisma.
 */
export const builder = new SchemaBuilder<{
  Context: GraphQLContext
  AuthScopes: {
    loggedIn: boolean
    perm: PermissionScope
  }
  DefaultAuthStrategy: "all"
  Scalars: {
    DateTime: { Input: Date; Output: Date }
    JSON: { Input: unknown; Output: unknown }
  }
}>({
  plugins: [ScopeAuthPlugin],
  scopeAuth: {
    defaultStrategy: "all",
    cacheKey: (value) => JSON.stringify(value),
    treatErrorsAsUnauthorized: true,
    authScopes: async (context) => ({
      loggedIn: !!context.subject,
      perm: async ({ permission, resourceId }: PermissionScope) => {
        if (!context.subject) return false
        return check(context.subject, permission, resourceId)
      },
    }),
  },
})

export const requirePerm = (permission: Permission, resourceId: string) => ({
  perm: { permission, resourceId },
})
