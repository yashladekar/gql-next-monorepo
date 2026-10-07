"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { OrganizationPermissions } from "@/lib/graphql/projections"
import { gql } from "@/lib/graphql-client"

export type Organization = {
  id: string
  name: string
  slug: string
  plan: string
  permissions: OrganizationPermissions
}

const ORGANIZATION_QUERY = /* GraphQL */ `
  query Organization($id: ID!) {
    organization(id: $id) {
      id
      name
      slug
      plan
      permissions {
        canView
        canManage
        canViewMembers
        canViewTeams
        canManageMembers
        canManageTeams
        canManageBilling
        canViewAuditLogs
        canCreateProject
      }
    }
  }
`

const UPDATE_ORGANIZATION_MUTATION = /* GraphQL */ `
  mutation UpdateOrganization($id: ID!, $input: UpdateOrganizationInput!) {
    updateOrganization(id: $id, input: $input) {
      id
      name
      slug
      plan
      permissions {
        canView
        canManage
        canViewMembers
        canViewTeams
        canManageMembers
        canManageTeams
        canManageBilling
        canViewAuditLogs
        canCreateProject
      }
    }
  }
`

export function useOrganization(id: string | null, initialData?: Organization) {
  return useQuery({
    queryKey: ["organization", id],
    queryFn: () =>
      gql<{ organization: Organization | null }>(ORGANIZATION_QUERY, { id }).then(
        (data) => data.organization,
      ),
    enabled: !!id,
    initialData,
  })
}

export function useUpdateOrganization(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) =>
      gql<{ updateOrganization: Organization }>(UPDATE_ORGANIZATION_MUTATION, {
        id,
        input: { name },
      }).then((data) => data.updateOrganization),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", id] })
      queryClient.invalidateQueries({ queryKey: ["organizations"] })
    },
  })
}
