// Stable, human-readable IDs used by the demo seed and the OpenFGA tuples.
// Kept in the authz package because the tuples must reference exactly these IDs;
// the DB seed imports them so both sides cannot drift.

export const DEMO_IDS = {
  users: {
    alice: "user_alice",
    bob: "user_bob",
    charlie: "user_charlie",
    david: "user_david",
    eve: "user_eve",
  },
  orgs: {
    acme: "org_acme",
    globex: "org_globex",
  },
  teams: {
    platform: "team_platform",
    design: "team_design",
  },
  projects: {
    alpha: "proj_alpha",
    beta: "proj_beta",
    gamma: "proj_gamma",
    globexWeb: "proj_globex_web",
  },
  documents: {
    architecture: "doc_architecture",
    roadmap: "doc_roadmap",
    security: "doc_security_policy",
    prd: "doc_prd",
  },
} as const

export const DEMO_PASSWORD = "password1234"

export const DEMO_USERS = [
  { id: DEMO_IDS.users.alice, name: "Alice Owner", email: "alice@acme.test" },
  { id: DEMO_IDS.users.bob, name: "Bob Admin", email: "bob@acme.test" },
  { id: DEMO_IDS.users.charlie, name: "Charlie Editor", email: "charlie@acme.test" },
  { id: DEMO_IDS.users.david, name: "David Viewer", email: "david@acme.test" },
  { id: DEMO_IDS.users.eve, name: "Eve Globex", email: "eve@globex.test" },
] as const
