import { ClientError, GraphQLClient } from "graphql-request"

// graphql-request v7 requires an absolute URL, so resolve the endpoint against
// the current origin in the browser (and the configured base URL on the server).
let cachedClient: GraphQLClient | null = null
let cachedUrl = ""

function resolveUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/graphql`
  }
  const base =
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  return `${base.replace(/\/$/, "")}/api/graphql`
}

function client(): GraphQLClient {
  const url = resolveUrl()
  if (!cachedClient || cachedUrl !== url) {
    cachedClient = new GraphQLClient(url)
    cachedUrl = url
  }
  return cachedClient
}

export function gql<TData>(
  document: string,
  variables?: Record<string, unknown>,
): Promise<TData> {
  return client().request<TData>(document, variables)
}

/** Extract a human-readable message from a GraphQL error response. */
export function graphqlErrorMessage(error: unknown): string {
  if (error instanceof ClientError) {
    return error.response.errors?.[0]?.message ?? "Request failed"
  }
  if (error instanceof Error) return error.message
  return "Request failed"
}
