"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { gql } from "@/lib/graphql-client"

export type AccessRequest = {
  id: string
  resourceType: string
  resourceId: string
  requestedRelation: string
  message: string | null
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: string
  user: { id: string; name: string; email: string; image: string | null }
}

const ACCESS_REQUESTS_QUERY = /* GraphQL */ `
  query AccessRequests($organizationId: ID!) {
    accessRequests(organizationId: $organizationId) {
      id
      resourceType
      resourceId
      requestedRelation
      message
      status
      createdAt
      user {
        id
        name
        email
        image
      }
    }
  }
`

const ACCESS_REQUEST_FIELDS = /* GraphQL */ `
  id
  resourceType
  resourceId
  requestedRelation
  message
  status
  createdAt
  user {
    id
    name
    email
    image
  }
`

export function useAccessRequests(organizationId: string | null, initialData?: AccessRequest[]) {
  return useQuery({
    queryKey: ["access-requests", organizationId],
    queryFn: () =>
      gql<{ accessRequests: AccessRequest[] }>(ACCESS_REQUESTS_QUERY, { organizationId }).then(
        (data) => data.accessRequests,
      ),
    enabled: !!organizationId,
    initialData,
  })
}

/** Any user can request access to a resource they cannot currently edit. */
export function useRequestAccess(organizationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      resourceType: string
      resourceId: string
      requestedRelation: string
      message?: string
    }) =>
      gql<{ requestAccess: AccessRequest }>(
        /* GraphQL */ `
          mutation RequestAccess($input: AccessRequestInput!) {
            requestAccess(input: $input) {
              ${ACCESS_REQUEST_FIELDS}
            }
          }
        `,
        { input: { ...input, organizationId } },
      ).then((data) => data.requestAccess),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access-requests", organizationId] })
    },
  })
}

export function useDecideAccessRequest(organizationId: string) {
  const queryClient = useQueryClient()
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["access-requests", organizationId] })
    // Approving changes OpenFGA tuples, so resource projections may change.
    queryClient.invalidateQueries({ queryKey: ["projects", organizationId] })
    queryClient.invalidateQueries({ queryKey: ["project"] })
    queryClient.invalidateQueries({ queryKey: ["documents", organizationId] })
    queryClient.invalidateQueries({ queryKey: ["audit-logs", organizationId] })
    queryClient.invalidateQueries({ queryKey: ["dashboard", organizationId] })
  }

  const approve = useMutation({
    mutationFn: (id: string) =>
      gql<{ approveAccessRequest: AccessRequest }>(
        /* GraphQL */ `
          mutation ApproveAccessRequest($id: ID!) {
            approveAccessRequest(id: $id) {
              ${ACCESS_REQUEST_FIELDS}
            }
          }
        `,
        { id },
      ).then((data) => data.approveAccessRequest),
    onSuccess: invalidate,
  })

  const reject = useMutation({
    mutationFn: (id: string) =>
      gql<{ rejectAccessRequest: AccessRequest }>(
        /* GraphQL */ `
          mutation RejectAccessRequest($id: ID!) {
            rejectAccessRequest(id: $id) {
              ${ACCESS_REQUEST_FIELDS}
            }
          }
        `,
        { id },
      ).then((data) => data.rejectAccessRequest),
    onSuccess: invalidate,
  })

  return { approve, reject }
}
