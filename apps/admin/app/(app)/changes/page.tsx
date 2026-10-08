"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Search } from "lucide-react"
import { useState } from "react"
import { useStore } from "@/components/store-provider"
import { useChanges } from "@/hooks/use-ofga"

function isWrite(operation: string): boolean {
  return operation.toLowerCase().includes("write")
}

export default function ChangesPage() {
  const { storeId } = useStore()
  const [type, setType] = useState("")
  const [appliedType, setAppliedType] = useState("")
  const [tokens, setTokens] = useState<(string | undefined)[]>([undefined])
  const [page, setPage] = useState(0)
  const continuationToken = tokens[page]

  const { data, isPending, error } = useChanges(storeId, {
    type: appliedType || undefined,
    continuationToken,
  })

  function applyFilter() {
    setAppliedType(type)
    setTokens([undefined])
    setPage(0)
  }

  function nextPage() {
    if (!data?.continuationToken) return
    setTokens((previous) => [...previous.slice(0, page + 1), data.continuationToken])
    setPage((value) => value + 1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Changes</h1>
        <p className="text-sm text-muted-foreground">
          Audit feed of every tuple write in the selected store.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter</CardTitle>
          <CardDescription>Optionally restrict by object type (e.g. project).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="project"
              value={type}
              onChange={(event) => setType(event.target.value)}
            />
            <Button variant="outline" onClick={applyFilter}>
              <Search className="size-4" />
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load changes"}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline</CardTitle>
          <CardDescription>{data?.changes.length ?? 0} change(s) on this page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPending ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Spinner className="size-4" /> Loading…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operation</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Relation</TableHead>
                  <TableHead>Object</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.changes ?? []).map((change, index) => (
                  <TableRow key={`${change.timestamp}-${index}`}>
                    <TableCell>
                      <Badge variant={isWrite(change.operation) ? "default" : "destructive"}>
                        {isWrite(change.operation) ? "write" : "delete"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{change.user}</TableCell>
                    <TableCell>{change.relation}</TableCell>
                    <TableCell className="font-mono text-xs">{change.object}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {change.timestamp ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {data && data.changes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                      No changes recorded.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">Page {page + 1}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={!data?.continuationToken}
              onClick={nextPage}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
