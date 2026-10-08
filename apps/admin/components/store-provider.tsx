"use client"

import { useQueryClient } from "@tanstack/react-query"
import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import { ACTIVE_STORE_COOKIE } from "@/lib/constants"

type StoreContextValue = {
  storeId: string
  setStoreId: (id: string) => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({
  initialStoreId,
  children,
}: {
  initialStoreId: string
  children: ReactNode
}) {
  const [storeId, setStoreIdState] = useState(initialStoreId)
  const queryClient = useQueryClient()

  const value = useMemo<StoreContextValue>(
    () => ({
      storeId,
      setStoreId: (id: string) => {
        document.cookie = `${ACTIVE_STORE_COOKIE}=${id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
        setStoreIdState(id)
        void queryClient.invalidateQueries({ queryKey: ["ofga"] })
      },
    }),
    [storeId, queryClient],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreContextValue {
  const context = useContext(StoreContext)
  if (!context) throw new Error("useStore must be used inside <StoreProvider>")
  return context
}
