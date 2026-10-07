"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import type { ReactElement, ReactNode } from "react"
import { useState } from "react"
import { useUpdateDocument, type DocumentSummary } from "@/hooks/use-documents"
import { useProjectDocuments } from "@/hooks/use-project"
import { graphqlErrorMessage } from "@/lib/graphql-client"

export function DocumentFormDialog({
  projectId,
  document,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  projectId: string
  document?: DocumentSummary
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen

  const [title, setTitle] = useState(document?.title ?? "")
  const [body, setBody] = useState(document?.body ?? "")
  const [error, setError] = useState<string | null>(null)

  const create = useProjectDocuments(projectId)
  const update = useUpdateDocument()
  const pending = create.isPending || update.isPending

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setTitle(document?.title ?? "")
      setBody(document?.body ?? "")
      setError(null)
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      if (document) {
        await update.mutateAsync({ id: document.id, title, body })
      } else {
        await create.mutateAsync({ title, body })
      }
      setOpen(false)
    } catch (mutationError) {
      setError(graphqlErrorMessage(mutationError))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger render={trigger as ReactElement} /> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{document ? "Edit document" : "New document"}</DialogTitle>
          <DialogDescription>
            {document
              ? "Update the document contents."
              : "Documents reside in a project and inherit its access."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="document-title">Title</Label>
            <Input
              id="document-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="document-body">Body</Label>
            <Textarea
              id="document-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={6}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {document ? "Save changes" : "Create document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
