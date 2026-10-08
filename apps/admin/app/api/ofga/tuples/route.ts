import {
  deleteTuplesAdmin,
  readTuplesPage,
  writeTuplesAdmin,
  type FgaTuple,
} from "@workspace/authz"
import { NextResponse } from "next/server"
import { asString, errorResponse, guard, readJson, resolveStoreId } from "@/lib/ofga-api"

function parseTuples(value: unknown): FgaTuple[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => entry as Record<string, unknown>)
    .filter(
      (entry) =>
        typeof entry.user === "string" &&
        typeof entry.relation === "string" &&
        typeof entry.object === "string",
    )
    .map((entry) => ({
      user: entry.user as string,
      relation: entry.relation as string,
      object: entry.object as string,
    }))
}

export async function GET(request: Request) {
  const denied = await guard()
  if (denied) return denied
  try {
    const url = new URL(request.url)
    const storeId = await resolveStoreId(url.searchParams.get("storeId"))
    const page = await readTuplesPage(storeId, {
      object: asString(url.searchParams.get("object")),
      user: asString(url.searchParams.get("user")),
      relation: asString(url.searchParams.get("relation")),
      continuationToken: asString(url.searchParams.get("continuationToken")),
    })
    return NextResponse.json(page)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  const denied = await guard()
  if (denied) return denied
  try {
    const body = await readJson(request)
    const storeId = await resolveStoreId(asString(body.storeId))
    const tuples = parseTuples(body.tuples)
    if (tuples.length === 0) {
      return NextResponse.json({ error: "At least one valid tuple is required" }, { status: 400 })
    }
    await writeTuplesAdmin(storeId, tuples)
    return NextResponse.json({ ok: true, written: tuples.length })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(request: Request) {
  const denied = await guard()
  if (denied) return denied
  try {
    const body = await readJson(request)
    const storeId = await resolveStoreId(asString(body.storeId))
    const tuples = parseTuples(body.tuples)
    if (tuples.length === 0) {
      return NextResponse.json({ error: "At least one valid tuple is required" }, { status: 400 })
    }
    await deleteTuplesAdmin(storeId, tuples)
    return NextResponse.json({ ok: true, deleted: tuples.length })
  } catch (error) {
    return errorResponse(error)
  }
}
