"use client"

import { Badge } from "@workspace/ui/components/badge"
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
import { Check, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { useStore } from "@/components/store-provider"
import { useCreateStore, useDeleteStore, useStores } from "@/hooks/use-ofga"

export default function StoresPage() {
  const { storeId, setStoreId } = useStore()
  const { data: stores, isPending, error } = useStores()
  const createStore = useCreateStore()
  const deleteStore = useDeleteStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")

  function onCreate() {
    if (!name.trim()) return
    createStore.mutate(name.trim(), {
      onSuccess: (store) => {
        setStoreId(store.id)
        setName("")
        setOpen(false)
      },
    })
  }

  function onDelete(id: string, storeName: string) {
    if (!window.confirm(`Delete store "${storeName}"? This cannot be undone.`)) return
    deleteStore.mutate(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Stores</h1>
          <p className="text-sm text-muted-foreground">
            OpenFGA stores visible to this server. Select one to manage its models and tuples.
          </p>
        </div>
        <Button
          onClick={() => {
            createStore.reset()
            setOpen(true)
          }}
        >
          <Plus className="size-4" />
          New store
        </Button>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load stores"}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All stores</CardTitle>
          <CardDescription>{stores?.length ?? 0} store(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Spinner className="size-4" /> Loading…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Store ID</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(stores ?? []).map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-medium">{store.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {store.id}
                    </TableCell>
                    <TableCell>
                      {store.id === storeId ? (
                        <Badge variant="secondary">
                          <Check className="size-3" /> Active
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={store.id === storeId}
                          onClick={() => setStoreId(store.id)}
                        >
                          Use
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          onClick={() => onDelete(store.id, store.name)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {stores && stores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                      No stores yet. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
          {deleteStore.error ? (
            <p className="mt-3 text-sm text-destructive">
              {deleteStore.error instanceof Error ? deleteStore.error.message : "Delete failed"}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create store</DialogTitle>
            <DialogDescription>Give the new OpenFGA store a name.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="store-name">Name</Label>
            <Input
              id="store-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="my-store"
            />
          </div>
          {createStore.error ? (
            <p className="text-sm text-destructive">
              {createStore.error instanceof Error ? createStore.error.message : "Create failed"}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onCreate} disabled={createStore.isPending || !name.trim()}>
              {createStore.isPending ? <Spinner className="size-4" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
