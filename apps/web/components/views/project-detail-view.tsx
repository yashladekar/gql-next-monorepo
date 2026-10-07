"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Pencil, Plus, Settings, Share2, Trash2 } from "lucide-react"
import { useState } from "react"
import { Can } from "@/components/fgac/can"
import { PermissionButton } from "@/components/fgac/permission-button"
import { DocumentFormDialog } from "@/components/document-form-dialog"
import { EmptyState } from "@/components/data-state"
import { PageHeader } from "@/components/page-header"
import { ProjectFormDialog } from "@/components/project-form-dialog"
import { useRequestAccess } from "@/hooks/use-access-requests"
import { useDeleteDocument } from "@/hooks/use-documents"
import { usePermissions } from "@/hooks/use-permissions"
import { useProject } from "@/hooks/use-project"
import { useDeleteProject } from "@/hooks/use-projects"
import { graphqlErrorMessage } from "@/lib/graphql-client"

const PERMISSION_LABELS: { key: string; label: string }[] = [
  { key: "canRead", label: "Read" },
  { key: "canUpdate", label: "Edit" },
  { key: "canDelete", label: "Delete" },
  { key: "canShare", label: "Share" },
  { key: "canCreateDocument", label: "Create documents" },
  { key: "canManage", label: "Manage" },
]

export function ProjectDetailView({ projectId }: { projectId: string }) {
  const { organizationId } = usePermissions()
  const { data: project, isPending } = useProject(projectId)
  const deleteProject = useDeleteProject(organizationId)
  const deleteDocument = useDeleteDocument()
  const requestAccess = useRequestAccess(organizationId)
  const [requested, setRequested] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)

  if (isPending || !project) {
    return (
      <>
        <PageHeader title="Project" />
        <Skeleton className="h-64 w-full" />
      </>
    )
  }

  const permissions = project.permissions
  const canEdit = permissions.canUpdate

  return (
    <>
      <PageHeader
        title={project.name}
        description={project.description ?? "No description."}
        actions={
          <>
            {/* Hide pattern: Edit appears only with project.update. */}
            <Can permission="project.update" on={permissions}>
              <ProjectFormDialog
                organizationId={organizationId}
                project={project}
                trigger={
                  <Button size="sm" variant="outline">
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                }
              />
            </Can>
            <Can permission="project.share" on={permissions}>
              <Button size="sm" variant="outline" disabled>
                <Share2 className="size-4" />
                Share
              </Button>
            </Can>
            <Can permission="project.manage" on={permissions}>
              <Button size="sm" variant="outline" disabled>
                <Settings className="size-4" />
                Project settings
              </Button>
            </Can>

            {/* Disable pattern: Delete stays visible but is disabled + explained. */}
            {permissions.canRead ? (
              <PermissionButton
                permission="project.delete"
                on={permissions}
                size="sm"
                variant="outline"
                disabledReason="You don't have permission to delete this project."
                onClick={() => {
                  if (window.confirm(`Delete "${project.name}"?`)) {
                    deleteProject.mutate(project.id)
                  }
                }}
              >
                <Trash2 className="size-4" />
                Delete
              </PermissionButton>
            ) : null}

            {/* A viewer who cannot edit can request access — FGAC-driven UX. */}
            {!canEdit && permissions.canRead ? (
              requested ? (
                <Badge variant="secondary">Access requested</Badge>
              ) : (
                <Button
                  size="sm"
                  disabled={requestAccess.isPending}
                  onClick={async () => {
                    setRequestError(null)
                    try {
                      await requestAccess.mutateAsync({
                        resourceType: "project",
                        resourceId: projectId,
                        requestedRelation: "editor",
                        message: "Requesting edit access to help on this project.",
                      })
                      setRequested(true)
                    } catch (error) {
                      setRequestError(graphqlErrorMessage(error))
                    }
                  }}
                >
                  Request edit access
                </Button>
              )
            ) : null}
          </>
        }
      />

      {requestError ? (
        <p className="mb-4 text-sm text-destructive">{requestError}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Documents</h2>
            <Can permission="project.create_document" on={permissions}>
              <DocumentFormDialog
                projectId={projectId}
                trigger={
                  <Button size="sm">
                    <Plus className="size-4" />
                    New document
                  </Button>
                }
              />
            </Can>
          </div>

          {project.documents.length === 0 ? (
            <EmptyState>No documents yet.</EmptyState>
          ) : (
            <div className="space-y-3">
              {project.documents.map((document) => (
                <Card key={document.id}>
                  <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{document.title}</CardTitle>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {document.body || "Empty document"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Can permission="document.update" on={document.permissions}>
                        <DocumentFormDialog
                          projectId={projectId}
                          document={document}
                          trigger={
                            <Button size="icon-sm" variant="ghost" aria-label="Edit document">
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                      </Can>
                      <Can permission="document.delete" on={document.permissions}>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Delete document"
                          onClick={() => {
                            if (window.confirm(`Delete "${document.title}"?`)) {
                              deleteDocument.mutate(document.id)
                            }
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </Can>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </section>

        <aside>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Your permissions here</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Computed by OpenFGA for this request — the UI reads them, it does not decide them.
              </p>
              <Separator />
              {PERMISSION_LABELS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <Badge variant={permissions[key as keyof typeof permissions] ? "default" : "secondary"}>
                    {permissions[key as keyof typeof permissions] ? "allowed" : "denied"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  )
}
