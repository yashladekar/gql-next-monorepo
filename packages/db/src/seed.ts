import { DEMO_IDS, DEMO_PASSWORD, DEMO_USERS } from "@workspace/authz"
import { PrismaClient, OrgRole } from "@prisma/client"
import { hashPassword } from "better-auth/crypto"

const prisma = new PrismaClient()

const { users, orgs, teams, projects, documents } = DEMO_IDS

const memberships: { org: string; user: string; role: OrgRole }[] = [
  { org: orgs.acme, user: users.alice, role: OrgRole.OWNER },
  { org: orgs.acme, user: users.bob, role: OrgRole.ADMIN },
  { org: orgs.acme, user: users.charlie, role: OrgRole.MEMBER },
  { org: orgs.acme, user: users.david, role: OrgRole.MEMBER },
  { org: orgs.globex, user: users.eve, role: OrgRole.OWNER },
  { org: orgs.globex, user: users.alice, role: OrgRole.MEMBER },
]

const teamMembers: { team: string; user: string }[] = [
  { team: teams.platform, user: users.bob },
  { team: teams.platform, user: users.charlie },
  { team: teams.design, user: users.david },
]

async function seedUsers(): Promise<void> {
  for (const demo of DEMO_USERS) {
    const password = await hashPassword(DEMO_PASSWORD)
    await prisma.user.upsert({
      where: { id: demo.id },
      update: { name: demo.name, email: demo.email },
      create: { id: demo.id, name: demo.name, email: demo.email, emailVerified: true },
    })
    await prisma.account.upsert({
      where: { id: `account_${demo.id}` },
      update: { password },
      create: {
        id: `account_${demo.id}`,
        accountId: demo.id,
        providerId: "credential",
        userId: demo.id,
        password,
      },
    })
  }
}

async function seedOrganizations(): Promise<void> {
  await prisma.organization.upsert({
    where: { id: orgs.acme },
    update: {},
    create: {
      id: orgs.acme,
      name: "Acme Inc.",
      slug: "acme",
      plan: "growth",
      billingEmail: "billing@acme.test",
      monthlyRevenue: 482000,
    },
  })
  await prisma.organization.upsert({
    where: { id: orgs.globex },
    update: {},
    create: { id: orgs.globex, name: "Globex", slug: "globex", plan: "free" },
  })

  for (const membership of memberships) {
    await prisma.membership.upsert({
      where: {
        organizationId_userId: {
          organizationId: membership.org,
          userId: membership.user,
        },
      },
      update: { role: membership.role },
      create: {
        organizationId: membership.org,
        userId: membership.user,
        role: membership.role,
      },
    })
  }
}

async function seedTeams(): Promise<void> {
  await prisma.team.upsert({
    where: { id: teams.platform },
    update: {},
    create: { id: teams.platform, organizationId: orgs.acme, name: "Platform" },
  })
  await prisma.team.upsert({
    where: { id: teams.design },
    update: {},
    create: { id: teams.design, organizationId: orgs.acme, name: "Design" },
  })

  for (const member of teamMembers) {
    await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: member.team, userId: member.user } },
      update: {},
      create: { teamId: member.team, userId: member.user },
    })
  }
}

async function seedProjects(): Promise<void> {
  const rows = [
    { id: projects.alpha, organizationId: orgs.acme, name: "Project Alpha", description: "Customer-facing web platform.", createdById: users.alice },
    { id: projects.beta, organizationId: orgs.acme, name: "Project Beta", description: "Internal data pipeline.", createdById: users.bob },
    { id: projects.gamma, organizationId: orgs.acme, name: "Project Gamma", description: "Mobile app groundwork.", createdById: users.alice },
    { id: projects.globexWeb, organizationId: orgs.globex, name: "Globex Web", description: "Globex marketing site.", createdById: users.eve },
  ]
  for (const row of rows) {
    await prisma.project.upsert({ where: { id: row.id }, update: {}, create: row })
  }
}

async function seedDocuments(): Promise<void> {
  const rows = [
    { id: documents.architecture, projectId: projects.alpha, title: "Architecture", body: "System architecture overview.", createdById: users.alice },
    { id: documents.roadmap, projectId: projects.alpha, title: "Roadmap", body: "Q3 product roadmap.", createdById: users.charlie },
    { id: documents.security, projectId: projects.beta, title: "Security Policy", body: "Security and compliance policy.", createdById: users.bob },
    { id: documents.prd, projectId: projects.gamma, title: "Product Requirements", body: "PRD for the mobile app.", createdById: users.alice },
  ]
  for (const row of rows) {
    await prisma.document.upsert({ where: { id: row.id }, update: {}, create: row })
  }
}

async function seedAccessRequestsAndAudit(): Promise<void> {
  await prisma.accessRequest.upsert({
    where: { id: "ar_david_alpha" },
    update: {},
    create: {
      id: "ar_david_alpha",
      organizationId: orgs.acme,
      userId: users.david,
      resourceType: "project",
      resourceId: projects.alpha,
      requestedRelation: "editor",
      message: "I'm helping on Project Alpha this sprint.",
    },
  })

  await prisma.auditLog.deleteMany({ where: { organizationId: orgs.acme } })
  await prisma.auditLog.createMany({
    data: [
      { organizationId: orgs.acme, actorId: users.alice, action: "organization.created", resourceType: "organization", resourceId: orgs.acme, metadata: { name: "Acme Inc." } },
      { organizationId: orgs.acme, actorId: users.alice, action: "project.created", resourceType: "project", resourceId: projects.alpha, metadata: { name: "Project Alpha" } },
      { organizationId: orgs.acme, actorId: users.bob, action: "member.invited", resourceType: "user", resourceId: users.charlie, metadata: { role: "MEMBER" } },
    ],
  })
}

async function main(): Promise<void> {
  console.log("→ Seeding demo users, organizations, projects and documents...")
  await seedUsers()
  await seedOrganizations()
  await seedTeams()
  await seedProjects()
  await seedDocuments()
  await seedAccessRequestsAndAudit()
  console.log("✓ Database seed complete.")
}

main()
  .catch((error: unknown) => {
    console.error("✗ Seed failed:", error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
