import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { createFgaClient, FGA_STORE_NAME, resetFgaClient } from "../client"
import { authorizationModel } from "../model"
import { writeTuples } from "../service"
import { demoTuples } from "../tuples"

// packages/authz/src/scripts/setup.ts -> repo root .env
const ENV_URL = new URL("../../../../.env", import.meta.url)

function upsertEnv(key: string, value: string): void {
  let content = existsSync(ENV_URL) ? readFileSync(ENV_URL, "utf8") : ""
  const line = `${key}="${value}"`
  const pattern = new RegExp(`^${key}=.*$`, "m")
  content = pattern.test(content)
    ? content.replace(pattern, line)
    : `${content.trimEnd()}\n${line}\n`
  writeFileSync(ENV_URL, content)
}

async function main(): Promise<void> {
  const root = createFgaClient()

  console.log("→ Looking up OpenFGA store...")
  const { stores } = await root.listStores()
  const existing = (stores ?? []).find((candidate) => candidate.name === FGA_STORE_NAME)
  const storeId = existing
    ? existing.id
    : (await root.createStore({ name: FGA_STORE_NAME })).id

  console.log(
    existing
      ? `→ Reusing store "${FGA_STORE_NAME}" (${storeId}).`
      : `→ Created store "${FGA_STORE_NAME}" (${storeId}).`,
  )

  process.env.FGA_STORE_ID = storeId
  resetFgaClient()

  console.log("→ Writing authorization model...")
  const scoped = createFgaClient(storeId)
  const { authorization_model_id: modelId } = await scoped.writeAuthorizationModel(
    authorizationModel as unknown as Parameters<typeof scoped.writeAuthorizationModel>[0],
  )
  process.env.FGA_MODEL_ID = modelId
  resetFgaClient()

  upsertEnv("FGA_STORE_ID", storeId)
  upsertEnv("FGA_MODEL_ID", modelId)
  console.log("→ Persisted FGA_STORE_ID and FGA_MODEL_ID to .env")

  console.log(`→ Writing ${demoTuples.length} relationship tuples...`)
  await writeTuples([...demoTuples], true)
  console.log("✓ OpenFGA setup complete.")
}

main().catch((error: unknown) => {
  console.error("✗ OpenFGA setup failed:", error)
  process.exit(1)
})
