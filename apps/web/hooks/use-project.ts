"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { DocumentPermissions, ProjectPermissions } from "@/lib/graphql/projections"
import { gql } from "@/lib/graphql-client"

export type ProjectDocument = {
  id: string
  projectId: string
  title: string
  body: string
  createdAt: string
  permissions: DocumentPermissions
}

export type ProjectDetail = {
  id: string
  name: string
  description: string | null
  archived: boolean
  createdAt: string
  permissions: ProjectPermissions
  documents: ProjectDocument[]
}

const DOCUMENT_FIELDS = /* GraphQL */ `
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
`

const PROJECT_QUERY = /* GraphQL */ `
  query Project($id: ID!) {
    project(id: $id) {
      id
      name
      description
      archived
      createdAt
      permissions {
        canRead
        canUpdate
        canDelete
        canShare
        canCreateDocument
        canManage
      }
      documents {
        ${DOCUMENT_FIELDS}
      }
    }
  }
`

export function useProject(id: string, initialData?: ProjectDetail | null) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () =>
      gql<{ project: ProjectDetail | null }>(PROJECT_QUERY, { id }).then((data) => data.project),
    initialData,
  })
}

export function useProjectDocuments(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { title: string; body?: string }) =>
      gql<{ createDocument: ProjectDocument }>(
        /* GraphQL */ `
          mutation CreateDocument($projectId: ID!, $input: DocumentInput!) {
            createDocument(projectId: $projectId, input: $input) {
              ${DOCUMENT_FIELDS}
            }
          }
        `,
        { projectId, input },
      ).then((data) => data.createDocument),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      queryClient.invalidateQueries({ queryKey: ["documents"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}
