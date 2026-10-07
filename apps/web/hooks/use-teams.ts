"use client"

import { useQuery } from "@tanstack/react-query"
import { gql } from "@/lib/graphql-client"

export type Team = { id: string; name: string; organizationId: string }

const TEAMS_QUERY = /* GraphQL */ `
  query Teams($organizationId: ID!) {
    teams(organizationId: $organizationId) {
      id
      name
      organizationId
    }
  }
`

export function useTeams(organizationId: string | null, initialData?: Team[]) {
  return useQuery({
    queryKey: ["teams", organizationId],
    queryFn: () =>
      gql<{ teams: Team[] }>(TEAMS_QUERY, { organizationId }).then((data) => data.teams),
    enabled: !!organizationId,
    initialData,
  })
}
