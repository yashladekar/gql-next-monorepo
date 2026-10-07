"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { DocumentPermissions } from "@/lib/graphql/projections"
import { gql } from "@/lib/graphql-client"

export type DocumentSummary = {
  id: string
  projectId: string
  title: string
  body: string
  createdAt: string
  permissions: DocumentPermissions
}

const DOCUMENTS_QUERY = /* GraphQL */ `
  query Documents($organizationId: ID!) {
    documents(organizationId: $organizationId) {
      id
      projectId
      title
      body
      createdAt
      permissions {
        canRead
        canUpdate
        canDelete
        canShare
      }
    }
  }
`

const UPDATE_DOCUMENT_MUTATION = /* GraphQL */ `
  mutation UpdateDocument($id: ID!, $input: DocumentInput!) {
    updateDocument(id: $id, input: $input) {
      id
      projectId
      title
      body
      createdAt
      permissions {
        canRead
        canUpdate
        canDelete
        canShare
      }
    }
  }
`

const DELETE_DOCUMENT_MUTATION = /* GraphQL */ `
  mutation DeleteDocument($id: ID!) {
    deleteDocument(id: $id)
  }
`

export function useDocuments(organizationId: string | null, initialData?: DocumentSummary[]) {
  return useQuery({
    queryKey: ["documents", organizationId],
    queryFn: () =>
      gql<{ documents: DocumentSummary[] }>(DOCUMENTS_QUERY, { organizationId }).then(
        (data) => data.documents,
      ),
    enabled: !!organizationId,
    initialData,
  })
}

export function useUpdateDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; title: string; body?: string }) =>
      gql<{ updateDocument: DocumentSummary }>(UPDATE_DOCUMENT_MUTATION, {
        id: input.id,
        input: { title: input.title, body: input.body },
      }).then((data) => data.updateDocument),
    onSuccess: (document) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] })
      queryClient.invalidateQueries({ queryKey: ["project", document.projectId] })
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      gql<{ deleteDocument: boolean }>(DELETE_DOCUMENT_MUTATION, { id }).then(
        (data) => data.deleteDocument,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] })
      queryClient.invalidateQueries({ queryKey: ["project"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}
