import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Database, History, Link2, Search, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { requireAdminContext } from "@/lib/admin-guard"

const SECTIONS = [
  { href: "/stores", label: "Stores", description: "Connect to and manage OpenFGA stores.", icon: Database },
  { href: "/models", label: "Authorization Models", description: "Read, write and diff models in DSL or JSON.", icon: ShieldCheck },
  { href: "/tuples", label: "Tuples", description: "Search, create and delete relationship tuples.", icon: Link2 },
  { href: "/explore", label: "Access Explorer", description: "Run Check / ListObjects / ListUsers queries.", icon: Search },
  { href: "/changes", label: "Changes", description: "Audit feed of every tuple write.", icon: History },
]

export default async function OverviewPage() {
  const context = await requireAdminContext()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">
          OpenFGA administration for the organizations you manage.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>OpenFGA API</CardDescription>
            <CardTitle className="text-base break-all">
              {process.env.OPENFGA_API_URL ?? "not set"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Store</CardDescription>
            <CardTitle className="text-base break-all">
              {process.env.FGA_STORE_ID ?? "not set"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active model</CardDescription>
            <CardTitle className="text-base break-all">
              {process.env.FGA_MODEL_ID ?? "not set"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Organizations you manage:</span>
        {context.organizations.map((org) => (
          <Badge key={org.id} variant="secondary">
            {org.name}
          </Badge>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href} className="group">
            <Card className="h-full transition-colors group-hover:border-foreground/20">
              <CardHeader>
                <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                  <section.icon className="size-4" />
                </div>
                <CardTitle className="text-base">{section.label}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
