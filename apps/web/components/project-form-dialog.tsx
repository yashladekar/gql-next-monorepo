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
import { useCreateProject, useUpdateProject, type ProjectSummary } from "@/hooks/use-projects"
import { graphqlErrorMessage } from "@/lib/graphql-client"

export function ProjectFormDialog({
  organizationId,
  project,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  organizationId: string
  project?: ProjectSummary
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen

  const [name, setName] = useState(project?.name ?? "")
  const [description, setDescription] = useState(project?.description ?? "")
  const [error, setError] = useState<string | null>(null)

  const create = useCreateProject(organizationId)
  const update = useUpdateProject(organizationId)
  const pending = create.isPending || update.isPending

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setName(project?.name ?? "")
      setDescription(project?.description ?? "")
      setError(null)
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      if (project) {
        await update.mutateAsync({ id: project.id, name, description })
      } else {
        await create.mutateAsync({ name, description })
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
          <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>
            {project
              ? "Update the project details."
              : "The creator becomes the project owner; OpenFGA records the relationship."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {project ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
