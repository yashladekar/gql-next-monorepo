"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Copy, Eye, MoreHorizontal, Pencil, Plus, Share2, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Can } from "@/components/fgac/can"
import { EmptyState, LoadingRows } from "@/components/data-state"
import { PageHeader } from "@/components/page-header"
import { ProjectFormDialog } from "@/components/project-form-dialog"
import { usePermissions } from "@/hooks/use-permissions"
import { useDeleteProject, useProjects, type ProjectSummary } from "@/hooks/use-projects"

function ProjectActions({
  project,
  organizationId,
}: {
  project: ProjectSummary
  organizationId: string
}) {
  const deleteProject = useDeleteProject(organizationId)
  const [editing, setEditing] = useState(false)
  const permissions = project.permissions

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label="Project actions" />}
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {/* Always available: everyone authorized to see the project can view it. */}
          <DropdownMenuItem render={<Link href={`/projects/${project.id}`} />}>
            <Eye className="size-4" />
            View
          </DropdownMenuItem>

          {/* Action-level FGAC: items appear only when the permission projection allows. */}
          <Can permission="project.update" on={permissions}>
            <DropdownMenuItem onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
              Edit
            </DropdownMenuItem>
          </Can>
          <Can permission="project.update" on={permissions}>
            <DropdownMenuItem disabled>
              <Copy className="size-4" />
              Duplicate
            </DropdownMenuItem>
          </Can>
          <Can permission="project.share" on={permissions}>
            <DropdownMenuItem disabled>
              <Share2 className="size-4" />
              Share
            </DropdownMenuItem>
          </Can>
          <Can permission="project.update" on={permissions}>
            <DropdownMenuItem disabled>Archive</DropdownMenuItem>
          </Can>

          <Can permission="project.delete" on={permissions}>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                if (window.confirm(`Delete "${project.name}"? This cannot be undone.`)) {
                  deleteProject.mutate(project.id)
                }
              }}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </Can>
        </DropdownMenuContent>
      </DropdownMenu>

      {editing ? (
        <ProjectFormDialog
          organizationId={organizationId}
          project={project}
          open={editing}
          onOpenChange={setEditing}
        />
      ) : null}
    </>
  )
}

export function ProjectsView() {
  const { organizationId } = usePermissions()
  const { data: projects, isPending } = useProjects(organizationId)

  return (
    <>
      <PageHeader
        title="Projects"
        description="Row-level authorization: OpenFGA ListObjects decides which projects you receive."
        actions={
          <Can permission="organization.create_project">
            <ProjectFormDialog
              organizationId={organizationId}
              trigger={
                <Button size="sm">
                  <Plus className="size-4" />
                  New project
                </Button>
              }
            />
          </Can>
        }
      />

      {isPending || !projects ? (
        <LoadingRows rows={3} />
      ) : projects.length === 0 ? (
        <EmptyState>
          No projects are visible to you here.
          <Can permission="organization.create_project">
            {" "}
            Create the first one to get started.
          </Can>
        </EmptyState>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    <Link href={`/projects/${project.id}`} className="hover:underline">
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {project.description ?? "—"}
                  </TableCell>
                  <TableCell>
                    {project.archived ? (
                      <Badge variant="secondary">Archived</Badge>
                    ) : (
                      <Badge variant="outline">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <ProjectActions project={project} organizationId={organizationId} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
