"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { gql } from "@/lib/graphql-client"

export type OrgRole = "OWNER" | "ADMIN" | "MEMBER"

export type Member = {
  id: string
  role: OrgRole
  userId: string
  user: { id: string; name: string; email: string; image: string | null }
}

const MEMBERS_QUERY = /* GraphQL */ `
  query Members($organizationId: ID!) {
    members(organizationId: $organizationId) {
      id
      role
      userId
      user {
        id
        name
        email
        image
      }
    }
  }
`

export function useMembers(organizationId: string | null, initialData?: Member[]) {
  return useQuery({
    queryKey: ["members", organizationId],
    queryFn: () =>
      gql<{ members: Member[] }>(MEMBERS_QUERY, { organizationId }).then((data) => data.members),
    enabled: !!organizationId,
    initialData,
  })
}

export function useInviteMember(organizationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { email: string; name?: string; role: OrgRole }) =>
      gql<{ inviteMember: Member }>(
        /* GraphQL */ `
          mutation InviteMember($organizationId: ID!, $input: InviteMemberInput!) {
            inviteMember(organizationId: $organizationId, input: $input) {
              id
              role
              userId
              user {
                id
                name
                email
                image
              }
            }
          }
        `,
        { organizationId, input },
      ).then((data) => data.inviteMember),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", organizationId] })
      queryClient.invalidateQueries({ queryKey: ["dashboard", organizationId] })
    },
  })
}

export function useChangeMemberRole(organizationId: string) {
  const queryClient = useQueryClient()
  const key = ["members", organizationId]

  return useMutation({
    mutationFn: (input: { userId: string; role: OrgRole }) =>
      gql<{ changeMemberRole: Member }>(
        /* GraphQL */ `
          mutation ChangeMemberRole($organizationId: ID!, $userId: ID!, $role: OrgRole!) {
            changeMemberRole(organizationId: $organizationId, userId: $userId, role: $role) {
              id
              role
              userId
              user {
                id
                name
                email
                image
              }
            }
          }
        `,
        { organizationId, userId: input.userId, role: input.role },
      ).then((data) => data.changeMemberRole),

    // Optimistic update: show the new role immediately...
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Member[]>(key)
      queryClient.setQueryData<Member[]>(key, (old) =>
        old?.map((member) =>
          member.userId === input.userId ? { ...member, role: input.role } : member,
        ),
      )
      return { previous }
    },
    // ...but roll back if the server (OpenFGA) denies it.
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
      queryClient.invalidateQueries({ queryKey: ["organization", organizationId] })
    },
  })
}

export function useRemoveMember(organizationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) =>
      gql<{ removeMember: boolean }>(
        /* GraphQL */ `
          mutation RemoveMember($organizationId: ID!, $userId: ID!) {
            removeMember(organizationId: $organizationId, userId: $userId)
          }
        `,
        { organizationId, userId },
      ).then((data) => data.removeMember),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", organizationId] })
      queryClient.invalidateQueries({ queryKey: ["dashboard", organizationId] })
    },
  })
}
