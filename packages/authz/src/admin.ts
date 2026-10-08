import {
  ConsistencyPreference,
  type AuthorizationModel,
  type ClientReadChangesRequest,
  type WriteAuthorizationModelRequest,
} from "@openfga/sdk"
import { createFgaClient } from "./client"
import type { FgaTuple } from "./service"

// Admin (console) operations. Unlike the tenant-facing service, these target an
// explicit store/model so an administrator can manage any store.

const CONSISTENCY = { consistency: ConsistencyPreference.HigherConsistency }

/** A relationship tuple, as consumed by the admin UI. */
export type TupleRecord = FgaTuple

export type StoreSummary = { id: string; name: string; createdAt?: string }

export type ModelTypeDefinition = {
  type: string
  relations?: Record<string, unknown>
  metadata?: unknown
}

export type ModelJson = {
  schema_version: string
  type_definitions: ModelTypeDefinition[]
  conditions?: Record<string, unknown>
}

export type ModelSummary = {
  id: string
  schemaVersion: string
  createdAt?: string
  typeCount: number
  relationCount: number
}

export type TuplePage = { tuples: FgaTuple[]; continuationToken?: string }

export type ChangeRecord = {
  user: string
  relation: string
  object: string
  operation: string
  timestamp?: string
}

export type ChangesPage = { changes: ChangeRecord[]; continuationToken?: string }

function toModelJson(model: AuthorizationModel | Omit<AuthorizationModel, "id">): ModelJson {
  return {
    schema_version: model.schema_version,
    type_definitions: (model.type_definitions ?? []).map((definition) => ({
      type: definition.type,
      ...(definition.relations ? { relations: definition.relations } : {}),
      ...(definition.metadata ? { metadata: definition.metadata } : {}),
    })),
    ...(model.conditions ? { conditions: model.conditions } : {}),
  }
}

// --- Stores ---------------------------------------------------------------

export async function listStoresAdmin(): Promise<StoreSummary[]> {
  const { stores } = await createFgaClient().listStores()
  return (stores ?? []).map((store) => ({
    id: store.id,
    name: store.name,
    createdAt: store.created_at,
  }))
}

export async function createStoreAdmin(name: string): Promise<StoreSummary> {
  const store = await createFgaClient().createStore({ name })
  return { id: store.id, name: store.name, createdAt: store.created_at }
}

export async function deleteStoreAdmin(storeId: string): Promise<void> {
  await createFgaClient(storeId).deleteStore()
}

// --- Authorization models ------------------------------------------------

export async function listModelsAdmin(storeId: string): Promise<ModelSummary[]> {
  const { authorization_models: models } = await createFgaClient(
    storeId,
  ).readAuthorizationModels()
  return (models ?? []).map((model) => {
    const record = model as unknown as Record<string, unknown>
    return {
      id: model.id,
      schemaVersion: model.schema_version,
      createdAt: typeof record.created_at === "string" ? record.created_at : undefined,
      typeCount: model.type_definitions?.length ?? 0,
      relationCount: (model.type_definitions ?? []).reduce(
        (sum, definition) => sum + Object.keys(definition.relations ?? {}).length,
        0,
      ),
    }
  })
}

export async function readModelAdmin(
  storeId: string,
  modelId: string,
): Promise<ModelJson | null> {
  const { authorization_model: model } = await createFgaClient(
    storeId,
    modelId,
  ).readAuthorizationModel()
  if (!model) return null
  return toModelJson(model)
}

export async function writeModelAdmin(storeId: string, model: ModelJson): Promise<string> {
  const { authorization_model_id: modelId } = await createFgaClient(
    storeId,
  ).writeAuthorizationModel(model as unknown as WriteAuthorizationModelRequest)
  return modelId
}

export async function validateDslAdmin(dsl: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const { validator } = await import("@openfga/syntax-transformer")
    validator.validateDSL(dsl)
    return { valid: true }
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function writeModelFromDslAdmin(storeId: string, dsl: string): Promise<string> {
  const { transformer } = await import("@openfga/syntax-transformer")
  const parsed = transformer.transformDSLToJSONObject(dsl)
  return writeModelAdmin(storeId, toModelJson(parsed))
}

export async function modelToDslAdmin(model: ModelJson): Promise<string> {
  const { transformer } = await import("@openfga/syntax-transformer")
  return transformer.transformJSONToDSL(model as unknown as Omit<AuthorizationModel, "id">)
}

// --- Tuples ---------------------------------------------------------------

export async function readTuplesPage(
  storeId: string,
  filter: {
    object?: string
    user?: string
    relation?: string
    continuationToken?: string
    pageSize?: number
  } = {},
): Promise<TuplePage> {
  const { tuples, continuation_token: continuationToken } = await createFgaClient(storeId).read(
    {
      ...(filter.object ? { object: filter.object } : {}),
      ...(filter.user ? { user: filter.user } : {}),
      ...(filter.relation ? { relation: filter.relation } : {}),
    },
    {
      pageSize: filter.pageSize ?? 50,
      ...(filter.continuationToken ? { continuationToken: filter.continuationToken } : {}),
    },
  )
  return {
    tuples: (tuples ?? []).map((tuple) => ({
      user: tuple.key.user,
      relation: tuple.key.relation,
      object: tuple.key.object,
    })),
    continuationToken,
  }
}

export async function writeTuplesAdmin(storeId: string, tuples: FgaTuple[]): Promise<void> {
  if (tuples.length === 0) return
  await createFgaClient(storeId).writeTuples(tuples)
}

export async function deleteTuplesAdmin(storeId: string, tuples: FgaTuple[]): Promise<void> {
  if (tuples.length === 0) return
  await createFgaClient(storeId).deleteTuples(tuples)
}

// --- Changes --------------------------------------------------------------

export async function readChangesAdmin(
  storeId: string,
  filter: { type?: string; continuationToken?: string; pageSize?: number } = {},
): Promise<ChangesPage> {
  const body = (filter.type ? { type: filter.type } : {}) as ClientReadChangesRequest
  const { changes, continuation_token: continuationToken } = await createFgaClient(
    storeId,
  ).readChanges(body, {
    pageSize: filter.pageSize ?? 50,
    ...(filter.continuationToken ? { continuationToken: filter.continuationToken } : {}),
  })
  return {
    changes: (changes ?? []).map((change) => ({
      user: change.tuple_key.user,
      relation: change.tuple_key.relation,
      object: change.tuple_key.object,
      operation: String(change.operation),
      timestamp: change.timestamp,
    })),
    continuationToken,
  }
}

// --- Access explorer ------------------------------------------------------

export async function checkAdmin(
  storeId: string,
  params: { user: string; relation: string; object: string },
): Promise<boolean> {
  const { allowed } = await createFgaClient(storeId).check(params, CONSISTENCY)
  return allowed === true
}

export async function listObjectsAdmin(
  storeId: string,
  params: { user: string; relation: string; type: string },
): Promise<string[]> {
  const { objects } = await createFgaClient(storeId).listObjects(params, CONSISTENCY)
  return objects ?? []
}

export async function listUsersAdmin(
  storeId: string,
  params: { object: string; relation: string; userType: string },
): Promise<string[]> {
  const separator = params.object.indexOf(":")
  const object =
    separator === -1
      ? { type: params.object, id: "" }
      : { type: params.object.slice(0, separator), id: params.object.slice(separator + 1) }

  const { users } = await createFgaClient(storeId).listUsers(
    {
      object,
      relation: params.relation,
      user_filters: [{ type: params.userType }],
    },
    CONSISTENCY,
  )
  return (users ?? []).map((user) => {
    if (user.object) return `${user.object.type}:${user.object.id}`
    if (user.userset)
      return `${user.userset.type}:${user.userset.id}#${user.userset.relation}`
    if (user.wildcard) return `${user.wildcard.type}:*`
    return JSON.stringify(user)
  })
}
