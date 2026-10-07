// The authorization model as JSON — this is exactly what gets written to
// OpenFGA by `pnpm fga:setup`. It is the compiled form of
// `authorization-model.fga`; keep the two in sync.

const cu = (relation: string) => ({ computedUserset: { relation } })

const ttu = (tuplesetRelation: string, computedRelation: string) => ({
  tupleToUserset: {
    tupleset: { relation: tuplesetRelation },
    computedUserset: { relation: computedRelation },
  },
})

const union = (...child: unknown[]) => ({ union: { child } })

const USER = { type: "user" } as const
const ORG = { type: "organization" } as const
const PROJECT = { type: "project" } as const
const TEAM_MEMBER = { type: "team", relation: "member" } as const

const direct = (...types: unknown[]) => ({ directly_related_user_types: [...types] })

export const authorizationModel = {
  schema_version: "1.1",
  type_definitions: [
    { type: "user" },
    {
      type: "organization",
      relations: {
        owner: { this: {} },
        admin: { this: {} },
        member: { this: {} },
        can_view: union(cu("member"), cu("admin"), cu("owner")),
        can_view_members: union(cu("admin"), cu("owner")),
        can_view_teams: union(cu("member"), cu("admin"), cu("owner")),
        can_view_projects: union(cu("admin"), cu("owner")),
        can_manage_organization: union(cu("admin"), cu("owner")),
        can_manage_members: union(cu("admin"), cu("owner")),
        can_manage_teams: union(cu("admin"), cu("owner")),
        can_view_audit_logs: union(cu("admin"), cu("owner")),
        can_manage_billing: cu("owner"),
        can_create_project: union(cu("admin"), cu("owner")),
        can_edit_project: union(cu("admin"), cu("owner")),
        can_delete_project: cu("owner"),
      },
      metadata: {
        relations: {
          owner: direct(USER),
          admin: direct(USER),
          member: direct(USER),
          can_view: direct(),
          can_view_members: direct(),
          can_view_teams: direct(),
          can_view_projects: direct(),
          can_manage_organization: direct(),
          can_manage_members: direct(),
          can_manage_teams: direct(),
          can_view_audit_logs: direct(),
          can_manage_billing: direct(),
          can_create_project: direct(),
          can_edit_project: direct(),
          can_delete_project: direct(),
        },
      },
    },
    {
      type: "team",
      relations: {
        organization: { this: {} },
        owner: { this: {} },
        member: { this: {} },
        can_view: union(cu("member"), cu("owner"), ttu("organization", "can_view")),
        can_view_members: union(cu("member"), cu("owner"), ttu("organization", "can_view_members")),
        can_manage_team: union(cu("owner"), ttu("organization", "can_manage_teams")),
      },
      metadata: {
        relations: {
          organization: direct(ORG),
          owner: direct(USER),
          member: direct(USER),
          can_view: direct(),
          can_view_members: direct(),
          can_manage_team: direct(),
        },
      },
    },
    {
      type: "project",
      relations: {
        organization: { this: {} },
        owner: { this: {} },
        editor: { this: {} },
        viewer: { this: {} },
        can_view: union(cu("viewer"), cu("editor"), cu("owner"), ttu("organization", "can_view_projects")),
        can_edit: union(cu("editor"), cu("owner"), ttu("organization", "can_edit_project")),
        can_delete: union(cu("owner"), ttu("organization", "can_delete_project")),
        can_share: union(cu("editor"), cu("owner")),
        can_create_document: union(cu("editor"), cu("owner")),
        can_manage_project: union(cu("owner"), ttu("organization", "can_manage_organization")),
      },
      metadata: {
        relations: {
          organization: direct(ORG),
          owner: direct(USER),
          editor: direct(USER, TEAM_MEMBER),
          viewer: direct(USER, TEAM_MEMBER),
          can_view: direct(),
          can_edit: direct(),
          can_delete: direct(),
          can_share: direct(),
          can_create_document: direct(),
          can_manage_project: direct(),
        },
      },
    },
    {
      type: "document",
      relations: {
        project: { this: {} },
        owner: { this: {} },
        editor: { this: {} },
        viewer: { this: {} },
        can_view: union(cu("viewer"), cu("editor"), cu("owner"), ttu("project", "can_view")),
        can_edit: union(cu("editor"), cu("owner"), ttu("project", "can_edit")),
        can_delete: union(cu("owner"), ttu("project", "can_delete")),
        can_share: union(cu("editor"), cu("owner"), ttu("project", "can_share")),
      },
      metadata: {
        relations: {
          project: direct(PROJECT),
          owner: direct(USER),
          editor: direct(USER),
          viewer: direct(USER),
          can_view: direct(),
          can_edit: direct(),
          can_delete: direct(),
          can_share: direct(),
        },
      },
    },
  ],
} as const
