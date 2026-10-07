"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { Can } from "@/components/fgac/can"
import { EmptyState, LoadingRows } from "@/components/data-state"
import { DocumentFormDialog } from "@/components/document-form-dialog"
import { PageHeader } from "@/components/page-header"
import { useDeleteDocument, useDocuments } from "@/hooks/use-documents"
import { usePermissions } from "@/hooks/use-permissions"

export function DocumentsView() {
  const { organizationId } = usePermissions()
  const { data: documents, isPending } = useDocuments(organizationId)
  const deleteDocument = useDeleteDocument()

  return (
    <>
      <PageHeader
        title="Documents"
        description="Only documents you can view are returned by the API."
      />
      {isPending || !documents ? (
        <LoadingRows rows={4} />
      ) : documents.length === 0 ? (
        <EmptyState>No documents are visible to you.</EmptyState>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell className="font-medium">{document.title}</TableCell>
                  <TableCell>
                    <Link
                      href={`/projects/${document.projectId}`}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      Open project
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <Can permission="document.update" on={document.permissions}>
                      <DocumentFormDialog
                        projectId={document.projectId}
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
