"use client"

import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Plus, Search, Trash2 } from "lucide-react"
import { useState } from "react"
import { useStore } from "@/components/store-provider"
import { useDeleteTuples, useTuples, useWriteTuples } from "@/hooks/use-ofga"

const EMPTY_TUPLE = { user: "", relation: "", object: "" }

export default function TuplesPage() {
  const { storeId } = useStore()
  const [filter, setFilter] = useState(EMPTY_TUPLE)
  const [applied, setApplied] = useState(EMPTY_TUPLE)
  const [tokens, setTokens] = useState<(string | undefined)[]>([undefined])
  const [page, setPage] = useState(0)
  const continuationToken = tokens[page]

  const { data, isPending, error } = useTuples(storeId, { ...applied, continuationToken })
  const writeTuples = useWriteTuples()
  const deleteTuples = useDeleteTuples()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_TUPLE)

  function applyFilters() {
    setApplied(filter)
    setTokens([undefined])
    setPage(0)
  }

  function nextPage() {
    if (!data?.continuationToken) return
    setTokens((previous) => [...previous.slice(0, page + 1), data.continuationToken])
    setPage((value) => value + 1)
  }

  function onCreate() {
    if (!form.user || !form.relation || !form.object) return
    writeTuples.mutate(
      { storeId, tuples: [form] },
      {
        onSuccess: () => {
          setForm(EMPTY_TUPLE)
          setOpen(false)
        },
      },
    )
  }

  function onDelete(tuple: { user: string; relation: string; object: string }) {
    deleteTuples.mutate({ storeId, tuples: [tuple] })
  }

  const mutationError = writeTuples.error ?? deleteTuples.error

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Tuples</h1>
          <p className="text-sm text-muted-foreground">
            Relationship tuples in the selected store. Facts, not permissions.
          </p>
        </div>
        <Button
          onClick={() => {
            writeTuples.reset()
            setOpen(true)
          }}
        >
          <Plus className="size-4" />
          New tuple
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Filter by user, relation or object (exact match).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            <Input
              placeholder="user:user_alice"
              value={filter.user}
              onChange={(event) => setFilter({ ...filter, user: event.target.value })}
            />
            <Input
              placeholder="viewer"
              value={filter.relation}
              onChange={(event) => setFilter({ ...filter, relation: event.target.value })}
            />
            <Input
              placeholder="project:proj_alpha"
              value={filter.object}
              onChange={(event) => setFilter({ ...filter, object: event.target.value })}
            />
            <Button variant="outline" onClick={applyFilters}>
              <Search className="size-4" />
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load tuples"}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Results</CardTitle>
          <CardDescription>{data?.tuples.length ?? 0} tuple(s) on this page</CardDescription>
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
                  <TableHead>User</TableHead>
                  <TableHead>Relation</TableHead>
                  <TableHead>Object</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.tuples ?? []).map((tuple) => (
                  <TableRow key={`${tuple.user}-${tuple.relation}-${tuple.object}`}>
                    <TableCell className="font-mono text-xs">{tuple.user}</TableCell>
                    <TableCell>{tuple.relation}</TableCell>
                    <TableCell className="font-mono text-xs">{tuple.object}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => onDelete(tuple)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {data && data.tuples.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                      No tuples match.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}

          {mutationError ? (
            <p className="text-sm text-destructive">
              {mutationError instanceof Error ? mutationError.message : "Operation failed"}
            </p>
          ) : null}

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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write tuple</DialogTitle>
            <DialogDescription>
              e.g. user:user_david · editor · project:proj_alpha
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="tuple-user">User</Label>
              <Input
                id="tuple-user"
                value={form.user}
                onChange={(event) => setForm({ ...form, user: event.target.value })}
                placeholder="user:user_david"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tuple-relation">Relation</Label>
              <Input
                id="tuple-relation"
                value={form.relation}
                onChange={(event) => setForm({ ...form, relation: event.target.value })}
                placeholder="editor"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tuple-object">Object</Label>
              <Input
                id="tuple-object"
                value={form.object}
                onChange={(event) => setForm({ ...form, object: event.target.value })}
                placeholder="project:proj_alpha"
              />
            </div>
          </div>
          {writeTuples.error ? (
            <p className="text-sm text-destructive">
              {writeTuples.error instanceof Error ? writeTuples.error.message : "Write failed"}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={onCreate}
              disabled={
                writeTuples.isPending || !form.user || !form.relation || !form.object
              }
            >
              {writeTuples.isPending ? <Spinner className="size-4" /> : null}
              Write
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
