"use client"

import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { MoreHorizontal, Trash2 } from "lucide-react"
import { Can } from "@/components/fgac/can"
import { LoadingRows } from "@/components/data-state"
import { PageHeader } from "@/components/page-header"
import { usePermissions } from "@/hooks/use-permissions"
import {
  useChangeMemberRole,
  useMembers,
  useRemoveMember,
  type Member,
  type OrgRole,
} from "@/hooks/use-members"
import { ORG_ROLE_LABELS } from "@/lib/nav"

const ROLES: OrgRole[] = ["OWNER", "ADMIN", "MEMBER"]

function MemberActions({ member, organizationId }: { member: Member; organizationId: string }) {
  const changeRole = useChangeMemberRole(organizationId)
  const remove = useRemoveMember(organizationId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Member actions" />}>
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Change role</DropdownMenuLabel>
          {ROLES.map((role) => (
            <DropdownMenuItem
              key={role}
              disabled={role === member.role || changeRole.isPending}
              onClick={() => changeRole.mutate({ userId: member.userId, role })}
            >
              {ORG_ROLE_LABELS[role]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={remove.isPending}
          onClick={() => {
            if (window.confirm(`Remove ${member.user.name} from the organization?`)) {
              remove.mutate(member.userId)
            }
          }}
        >
          <Trash2 className="size-4" />
          Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function MembersView() {
  const { organizationId } = usePermissions()
  const { data: members, isPending } = useMembers(organizationId)

  return (
    <>
      <PageHeader
        title="Members"
        description="Role controls appear only for users with organization.manage_members."
      />
      {isPending || !members ? (
        <LoadingRows rows={3} />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <Can permission="organization.manage_members">
                  <TableHead className="w-16 text-right">Actions</TableHead>
                </Can>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8 rounded-lg">
                        <AvatarFallback>
                          {member.user.name
                            .split(" ")
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{member.user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.role === "OWNER" ? "default" : "secondary"}>
                      {ORG_ROLE_LABELS[member.role]}
                    </Badge>
                  </TableCell>
                  <Can permission="organization.manage_members">
                    <TableCell className="text-right">
                      <MemberActions member={member} organizationId={organizationId} />
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
