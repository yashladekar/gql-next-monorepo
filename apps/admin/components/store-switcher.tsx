"use client"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Check, ChevronsUpDown, Database } from "lucide-react"
import { useStore } from "@/components/store-provider"
import { useStores } from "@/hooks/use-ofga"

export function StoreSwitcher() {
  const { storeId, setStoreId } = useStore()
  const { data: stores, isPending } = useStores()
  const active = stores?.find((store) => store.id === storeId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="w-full justify-between data-[popup-open]:bg-muted" />
        }
      >
        <span className="flex min-w-0 items-center gap-2">
          <Database className="size-4 shrink-0" />
          <span className="truncate text-sm font-medium">
            {active?.name ?? (isPending ? "Loading stores…" : "Select store")}
          </span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>OpenFGA stores</DropdownMenuLabel>
          {stores && stores.length > 0 ? (
            stores.map((store) => (
              <DropdownMenuItem key={store.id} onClick={() => setStoreId(store.id)}>
                <span className="flex flex-1 items-center gap-2">
                  <Database className="size-4" />
                  <span className="truncate">{store.name}</span>
                </span>
                {store.id === storeId ? <Check className="size-4" /> : null}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>No stores found</DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
