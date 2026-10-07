import { DEMO_IDS } from "./demo-ids"
import type { FgaTuple } from "./service"

const u = (id: string) => `user:${id}`
const org = (id: string) => `organization:${id}`
const team = (id: string) => `team:${id}`
const project = (id: string) => `project:${id}`
const doc = (id: string) => `document:${id}`

const { users, orgs, teams, projects, documents } = DEMO_IDS

// Relationship tuples for the demo. These encode the "who is related to what"
// facts; the authorization model turns them into permissions.
export const demoTuples: FgaTuple[] = [
  // --- Acme Inc. memberships ---
  { user: u(users.alice), relation: "owner", object: org(orgs.acme) },
  { user: u(users.bob), relation: "admin", object: org(orgs.acme) },
  { user: u(users.charlie), relation: "member", object: org(orgs.acme) },
  { user: u(users.david), relation: "member", object: org(orgs.acme) },

  // --- Globex (multi-tenancy) ---
  { user: u(users.eve), relation: "owner", object: org(orgs.globex) },
  { user: u(users.alice), relation: "member", object: org(orgs.globex) },

  // --- Teams ---
  { user: org(orgs.acme), relation: "organization", object: team(teams.platform) },
  { user: u(users.bob), relation: "owner", object: team(teams.platform) },
  { user: u(users.charlie), relation: "member", object: team(teams.platform) },
  { user: org(orgs.acme), relation: "organization", object: team(teams.design) },
  { user: u(users.david), relation: "member", object: team(teams.design) },

  // --- Projects ---
  // Alpha: Alice owner, Charlie editor, Platform team editors, David viewer.
  { user: org(orgs.acme), relation: "organization", object: project(projects.alpha) },
  { user: u(users.alice), relation: "owner", object: project(projects.alpha) },
  { user: u(users.charlie), relation: "editor", object: project(projects.alpha) },
  { user: `${team(teams.platform)}#member`, relation: "editor", object: project(projects.alpha) },
  { user: u(users.david), relation: "viewer", object: project(projects.alpha) },

  // Beta: Bob owner only -> Charlie/David cannot see it.
  { user: org(orgs.acme), relation: "organization", object: project(projects.beta) },
  { user: u(users.bob), relation: "owner", object: project(projects.beta) },

  // Gamma: Alice owner only.
  { user: org(orgs.acme), relation: "organization", object: project(projects.gamma) },
  { user: u(users.alice), relation: "owner", object: project(projects.gamma) },

  // Globex project (different tenant).
  { user: org(orgs.globex), relation: "organization", object: project(projects.globexWeb) },
  { user: u(users.eve), relation: "owner", object: project(projects.globexWeb) },

  // --- Documents (access inherited from their project) ---
  { user: project(projects.alpha), relation: "project", object: doc(documents.architecture) },
  { user: u(users.alice), relation: "owner", object: doc(documents.architecture) },
  { user: project(projects.alpha), relation: "project", object: doc(documents.roadmap) },
  { user: u(users.charlie), relation: "owner", object: doc(documents.roadmap) },
  { user: project(projects.beta), relation: "project", object: doc(documents.security) },
  { user: u(users.bob), relation: "owner", object: doc(documents.security) },
  { user: project(projects.gamma), relation: "project", object: doc(documents.prd) },
  { user: u(users.alice), relation: "owner", object: doc(documents.prd) },
]
