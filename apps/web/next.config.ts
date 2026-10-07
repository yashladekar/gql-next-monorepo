import { config } from "dotenv"
import type { NextConfig } from "next"

// Single canonical root .env (authoritative over the shell), with an optional
// .env.local override for the app.
config({ path: "../../.env", override: true })
config({ path: ".env.local", override: true })

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/db", "@workspace/authz"],
  experimental: {
    authInterrupts: true,
  },
}

export default nextConfig
