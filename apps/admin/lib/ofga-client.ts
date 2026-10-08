import type {
  ChangeRecord,
  ChangesPage,
  ModelJson,
  ModelSummary,
  ModelTypeDefinition,
  StoreSummary,
  TuplePage,
  TupleRecord,
} from "@workspace/authz"

// Re-export the server-shaped types so client components import from one place.
export type {
  ChangeRecord,
  ChangesPage,
  ModelJson,
  ModelSummary,
  ModelTypeDefinition,
  StoreSummary,
  TuplePage,
  TupleRecord,
}

export class ApiError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

export async function ofgaFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/ofga${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>
  if (!response.ok) {
    throw new ApiError(typeof data.error === "string" ? data.error : response.statusText, response.status)
  }
  return data as T
}

export function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value)
  }
  const query = search.toString()
  return query ? `?${query}` : ""
}
