"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ProjectPermissions } from "@/lib/graphql/projections"
import { gql } from "@/lib/graphql-client"

export type ProjectSummary = {
  id: string
  name: string
  description: string | null
  archived: boolean
  createdAt: string
  permissions: ProjectPermissions
}

const PROJECT_FIELDS = /* GraphQL */ `
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
`

const PROJECTS_QUERY = /* GraphQL */ `
  query Projects($organizationId: ID!) {
    projects(organizationId: $organizationId) {
      ${PROJECT_FIELDS}
    }
  }
`

const CREATE_PROJECT_MUTATION = /* GraphQL */ `
  mutation CreateProject($organizationId: ID!, $input: ProjectInput!) {
    createProject(organizationId: $organizationId, input: $input) {
      ${PROJECT_FIELDS}
    }
  }
`

const UPDATE_PROJECT_MUTATION = /* GraphQL */ `
  mutation UpdateProject($id: ID!, $input: ProjectInput!) {
    updateProject(id: $id, input: $input) {
      ${PROJECT_FIELDS}
    }
  }
`

const DELETE_PROJECT_MUTATION = /* GraphQL */ `
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id)
  }
`

export function useProjects(organizationId: string | null, initialData?: ProjectSummary[]) {
  return useQuery({
    queryKey: ["projects", organizationId],
    queryFn: () =>
      gql<{ projects: ProjectSummary[] }>(PROJECTS_QUERY, { organizationId }).then(
        (data) => data.projects,
      ),
    enabled: !!organizationId,
    initialData,
  })
}

export function useCreateProject(organizationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; description?: string }) =>
      gql<{ createProject: ProjectSummary }>(CREATE_PROJECT_MUTATION, {
        organizationId,
        input,
      }).then((data) => data.createProject),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", organizationId] })
      queryClient.invalidateQueries({ queryKey: ["dashboard", organizationId] })
    },
  })
}

export function useUpdateProject(organizationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; name: string; description?: string }) =>
      gql<{ updateProject: ProjectSummary }>(UPDATE_PROJECT_MUTATION, {
        id: input.id,
        input: { name: input.name, description: input.description },
      }).then((data) => data.updateProject),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["projects", organizationId] })
      queryClient.invalidateQueries({ queryKey: ["project", project.id] })
    },
  })
}

export function useDeleteProject(organizationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      gql<{ deleteProject: boolean }>(DELETE_PROJECT_MUTATION, { id }).then(
        (data) => data.deleteProject,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", organizationId] })
      queryClient.invalidateQueries({ queryKey: ["dashboard", organizationId] })
    },
  })
}
