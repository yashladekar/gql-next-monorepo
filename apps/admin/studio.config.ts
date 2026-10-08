import { auth } from "@workspace/auth"
import { defineStudioConfig } from "better-auth-studio/config"

// Better Auth Studio access control. Only emails in ADMIN_EMAILS may open the
// identity panel. When ADMIN_EMAILS is unset the panel denies everyone (fail
// closed) — set it in .env to grant access.
const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean)

export default defineStudioConfig({
  auth,
  basePath: "/api/studio",
  access: {
    // Studio requires a role in addition to the email allowlist. Only seeded
    // owners/admins carry the "admin" role.
    roles: ["admin"],
    ...(adminEmails.length > 0 ? { allowEmails: adminEmails } : {}),
  },
  metadata: {
    title: "FGAC Admin Studio",
    theme: "dark",
  },
})
