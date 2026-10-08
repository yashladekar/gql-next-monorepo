import { checkAdmin, listObjectsAdmin, listUsersAdmin } from "@workspace/authz"
import { NextResponse } from "next/server"
import { asString, errorResponse, guard, readJson, resolveStoreId } from "@/lib/ofga-api"

export async function POST(request: Request) {
  const denied = await guard()
  if (denied) return denied
  try {
    const body = await readJson(request)
    const storeId = await resolveStoreId(asString(body.storeId))
    const kind = asString(body.kind)

    if (kind === "check") {
      const user = asString(body.user)
      const relation = asString(body.relation)
      const object = asString(body.object)
      if (!user || !relation || !object) {
        return NextResponse.json({ error: "user, relation and object are required" }, { status: 400 })
      }
      return NextResponse.json({ kind, allowed: await checkAdmin(storeId, { user, relation, object }) })
    }

    if (kind === "listObjects") {
      const user = asString(body.user)
      const relation = asString(body.relation)
      const type = asString(body.type)
      if (!user || !relation || !type) {
        return NextResponse.json({ error: "user, relation and type are required" }, { status: 400 })
      }
      return NextResponse.json({ kind, objects: await listObjectsAdmin(storeId, { user, relation, type }) })
    }

    if (kind === "listUsers") {
      const object = asString(body.object)
      const relation = asString(body.relation)
      const userType = asString(body.userType)
      if (!object || !relation || !userType) {
        return NextResponse.json({ error: "object, relation and userType are required" }, { status: 400 })
      }
      return NextResponse.json({
        kind,
        users: await listUsersAdmin(storeId, { object, relation, userType }),
      })
    }

    return NextResponse.json({ error: "Unknown query kind" }, { status: 400 })
  } catch (error) {
    return errorResponse(error)
  }
}
