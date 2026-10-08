"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Spinner } from "@workspace/ui/components/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { useState } from "react"
import { useStore } from "@/components/store-provider"
import { useExplore, type ExploreResult } from "@/hooks/use-ofga"

type Kind = "check" | "listObjects" | "listUsers"

export default function ExplorePage() {
  const { storeId } = useStore()
  const [kind, setKind] = useState<Kind>("check")
  const [form, setForm] = useState({
    user: "user:user_david",
    relation: "can_view",
    object: "project:proj_alpha",
    type: "project",
    userType: "user",
  })
  const explore = useExplore()

  function run() {
    explore.mutate({ kind, storeId, ...form })
  }

  const result = explore.data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Access Explorer</h1>
        <p className="text-sm text-muted-foreground">
          Ask OpenFGA directly and watch an access decision being made.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Query</CardTitle>
          <CardDescription>Check a single decision, or list reachable objects/users.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={kind} onValueChange={(value) => setKind(value as Kind)}>
            <TabsList>
              <TabsTrigger value="check">Check</TabsTrigger>
              <TabsTrigger value="listObjects">ListObjects</TabsTrigger>
              <TabsTrigger value="listUsers">ListUsers</TabsTrigger>
            </TabsList>

            <TabsContent value="check" className="pt-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="User" value={form.user} onChange={(user) => setForm({ ...form, user })} />
                <Field label="Relation" value={form.relation} onChange={(relation) => setForm({ ...form, relation })} />
                <Field label="Object" value={form.object} onChange={(object) => setForm({ ...form, object })} />
              </div>
            </TabsContent>

            <TabsContent value="listObjects" className="pt-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="User" value={form.user} onChange={(user) => setForm({ ...form, user })} />
                <Field label="Relation" value={form.relation} onChange={(relation) => setForm({ ...form, relation })} />
                <Field label="Type" value={form.type} onChange={(type) => setForm({ ...form, type })} />
              </div>
            </TabsContent>

            <TabsContent value="listUsers" className="pt-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Object" value={form.object} onChange={(object) => setForm({ ...form, object })} />
                <Field label="Relation" value={form.relation} onChange={(relation) => setForm({ ...form, relation })} />
                <Field label="User type" value={form.userType} onChange={(userType) => setForm({ ...form, userType })} />
              </div>
            </TabsContent>
          </Tabs>

          <Button onClick={run} disabled={explore.isPending}>
            {explore.isPending ? <Spinner className="size-4" /> : null}
            Run query
          </Button>
        </CardContent>
      </Card>

      <ResultCard result={result} error={explore.error} />
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}

function ResultCard({ result, error }: { result?: ExploreResult; error: unknown }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Result</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Query failed"}
          </p>
        ) : !result ? (
          <p className="text-sm text-muted-foreground">Run a query to see the result.</p>
        ) : result.kind === "check" ? (
          <Badge variant={result.allowed ? "default" : "destructive"}>
            {result.allowed ? "allowed" : "denied"}
          </Badge>
        ) : (
          <ItemList items={result.kind === "listObjects" ? result.objects : result.users} />
        )}
      </CardContent>
    </Card>
  )
}

function ItemList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No results.</p>
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item}>
          <Badge variant="secondary" className="font-mono">
            {item}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
