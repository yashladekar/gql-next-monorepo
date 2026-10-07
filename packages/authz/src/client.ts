import { OpenFgaClient } from "@openfga/sdk"

// Name of the store created by `pnpm fga:setup`. Used to self-heal when
// FGA_STORE_ID is missing from the environment (e.g. `.env` was re-copied from
// the example), so the app recovers instead of crashing.
export const FGA_STORE_NAME = "fgac-demo"

let cached: OpenFgaClient | null = null
let initPromise: Promise<OpenFgaClient> | null = null

function requireApiUrl(): string {
  const apiUrl = process.env.OPENFGA_API_URL
  if (!apiUrl) {
    throw new Error(
      "OPENFGA_API_URL is not set. Copy .env.example to .env and run `pnpm fga:setup`.",
    )
  }
  return apiUrl
}

/** Build a client without any caching (used by setup/bootstrap). */
export function createFgaClient(storeId?: string, modelId?: string): OpenFgaClient {
  return new OpenFgaClient({
    apiUrl: requireApiUrl(),
    storeId: storeId || undefined,
    authorizationModelId: modelId || undefined,
  })
}

async function resolveClient(): Promise<OpenFgaClient> {
  const apiUrl = requireApiUrl()
  let storeId = process.env.FGA_STORE_ID || undefined
  let modelId = process.env.FGA_MODEL_ID || undefined

  if (!storeId) {
    const { stores } = await createFgaClient().listStores()
    storeId = (stores ?? []).find((store) => store.name === FGA_STORE_NAME)?.id
    if (!storeId) {
      throw new Error(
        `OpenFGA store "${FGA_STORE_NAME}" was not found. Run \`pnpm fga:setup\`.`,
      )
    }
    process.env.FGA_STORE_ID = storeId
  }

  if (!modelId) {
    const { authorization_models: models } = await createFgaClient(
      storeId,
    ).readAuthorizationModels({ pageSize: 1 })
    modelId = models?.[0]?.id
    if (modelId) process.env.FGA_MODEL_ID = modelId
  }

  return new OpenFgaClient({ apiUrl, storeId, authorizationModelId: modelId })
}

/** The shared OpenFGA client, resolved once per process. */
export async function getFgaClient(): Promise<OpenFgaClient> {
  if (cached) return cached
  initPromise ??= resolveClient().then((client) => {
    cached = client
    return client
  })
  return initPromise
}

/** Drop the cached client (used by setup after creating a store / writing a model). */
export function resetFgaClient(): void {
  cached = null
  initPromise = null
}
