"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Can } from "@/components/fgac/can"
import { EmptyState, LoadingRows } from "@/components/data-state"
import { PageHeader } from "@/components/page-header"
import { useDecideAccessRequest, useAccessRequests } from "@/hooks/use-access-requests"
import { usePermissions } from "@/hooks/use-permissions"

const STATUS_VARIANT = {
  PENDING: "outline",
  APPROVED: "default",
  REJECTED: "secondary",
} as const

export function AccessRequestsView() {
  const { organizationId } = usePermissions()
  const { data: requests, isPending } = useAccessRequests(organizationId)
  const { approve, reject } = useDecideAccessRequest(organizationId)

  return (
    <>
      <PageHeader
        title="Access Requests"
        description="Approving updates OpenFGA tuples, which changes what the requester can do."
      />
      {isPending || !requests ? (
        <LoadingRows rows={2} />
      ) : requests.length === 0 ? (
        <EmptyState>No access requests.</EmptyState>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requester</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Status</TableHead>
                <Can permission="organization.manage_members">
                  <TableHead className="text-right">Decision</TableHead>
                </Can>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <p className="text-sm font-medium">{request.user.name}</p>
                    <p className="text-xs text-muted-foreground">{request.user.email}</p>
                  </TableCell>
                  <TableCell className="text-sm">
                    {request.resourceType}: {request.resourceId}
                  </TableCell>
                  <TableCell className="text-sm">{request.requestedRelation}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[request.status]}>{request.status}</Badge>
                  </TableCell>
                  <Can permission="organization.manage_members">
                    <TableCell className="space-x-2 text-right">
                      <Button
                        size="sm"
                        disabled={request.status !== "PENDING" || approve.isPending}
                        onClick={() => approve.mutate(request.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={request.status !== "PENDING" || reject.isPending}
                        onClick={() => reject.mutate(request.id)}
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </Can>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
