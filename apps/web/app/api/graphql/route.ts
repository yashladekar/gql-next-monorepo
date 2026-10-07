import { createYoga } from "graphql-yoga"
import { createContext } from "@/lib/graphql/context"
import { schema } from "@/lib/graphql/schema"

export const runtime = "nodejs"

const yoga = createYoga({
  schema,
  context: createContext,
  graphqlEndpoint: "/api/graphql",
})

export { yoga as GET, yoga as POST, yoga as OPTIONS }
