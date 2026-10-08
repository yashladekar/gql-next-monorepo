// Client-safe navigation config for the admin console.

export type AdminNavItem = {
  key: string
  label: string
  href: string
  icon: string
}

export type AdminNavSection = {
  label: string
  items: AdminNavItem[]
}

export const ADMIN_NAV: AdminNavSection[] = [
  {
    label: "Overview",
    items: [{ key: "overview", label: "Overview", href: "/", icon: "LayoutDashboard" }],
  },
  {
    label: "OpenFGA",
    items: [
      { key: "stores", label: "Stores", href: "/stores", icon: "Database" },
      { key: "models", label: "Authorization Models", href: "/models", icon: "ShieldCheck" },
      { key: "tuples", label: "Tuples", href: "/tuples", icon: "Link2" },
      { key: "explore", label: "Access Explorer", href: "/explore", icon: "Search" },
      { key: "changes", label: "Changes", href: "/changes", icon: "History" },
    ],
  },
]

// The identity panel is embedded from better-auth-studio and served at this path.
export const STUDIO_HREF = "/api/studio"
