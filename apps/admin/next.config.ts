import { config } from "dotenv"
import type { NextConfig } from "next"

// Single canonical root .env (authoritative over the shell), with an optional
// .env.local override for the app.
config({ path: "../../.env", override: true })
config({ path: ".env.local", override: true })

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/db", "@workspace/authz", "@workspace/auth"],
  // better-auth-studio lazily transpiles the user's auth config with @babel at
  // runtime, which Turbopack cannot bundle. Keep it external so Node resolves it.
  serverExternalPackages: ["better-auth-studio"],
  experimental: {
    authInterrupts: true,
  },
}

export default nextConfig
