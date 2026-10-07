"use client"

import { useQuery } from "@tanstack/react-query"
import { gql } from "@/lib/graphql-client"

export type OrganizationSummary = { id: string; name: string; slug: string }

const ORGANIZATIONS_QUERY = /* GraphQL */ `
  query Organizations {
    organizations {
      id
      name
      slug
    }
  }
`

export function useOrganizations(initialData?: OrganizationSummary[]) {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: () =>
      gql<{ organizations: OrganizationSummary[] }>(ORGANIZATIONS_QUERY).then(
        (data) => data.organizations,
      ),
    initialData,
  })
}
