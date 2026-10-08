"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  buildQuery,
  ofgaFetch,
  type ChangesPage,
  type ModelJson,
  type ModelSummary,
  type StoreSummary,
  type TuplePage,
  type TupleRecord,
} from "@/lib/ofga-client"

export function useStores() {
  return useQuery({
    queryKey: ["ofga", "stores"],
    queryFn: () => ofgaFetch<{ stores: StoreSummary[] }>("/stores").then((data) => data.stores),
  })
}

export function useCreateStore() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) =>
      ofgaFetch<{ store: StoreSummary }>("/stores", {
        method: "POST",
        body: JSON.stringify({ name }),
      }).then((data) => data.store),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ofga", "stores"] }),
  })
}

export function useDeleteStore() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (storeId: string) =>
      ofgaFetch<{ ok: true }>(`/stores/${storeId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ofga"] }),
  })
}

export function useModels(storeId: string) {
  return useQuery({
    queryKey: ["ofga", "models", storeId],
    queryFn: () =>
      ofgaFetch<{ models: ModelSummary[] }>(
        `/models${buildQuery({ storeId })}`,
      ).then((data) => data.models),
    enabled: Boolean(storeId),
  })
}

export function useModel(storeId: string, modelId: string | null) {
  return useQuery({
    queryKey: ["ofga", "model", storeId, modelId],
    queryFn: () =>
      ofgaFetch<{ model: ModelJson; dsl: string }>(
        `/models/${modelId}${buildQuery({ storeId })}`,
      ),
    enabled: Boolean(storeId && modelId),
  })
}

export function useWriteModel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { storeId: string; dsl?: string; json?: ModelJson }) =>
      ofgaFetch<{ modelId: string }>("/models", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ofga", "models"] }),
  })
}

export function useValidateDsl() {
  return useMutation({
    mutationFn: (dsl: string) =>
      ofgaFetch<{ valid: boolean; error?: string }>("/validate", {
        method: "POST",
        body: JSON.stringify({ dsl }),
      }),
  })
}

export function useTuples(
  storeId: string,
  filter: { object?: string; user?: string; relation?: string; continuationToken?: string },
) {
  return useQuery({
    queryKey: ["ofga", "tuples", storeId, filter],
    queryFn: () => ofgaFetch<TuplePage>(`/tuples${buildQuery({ storeId, ...filter })}`),
    enabled: Boolean(storeId),
  })
}

export function useWriteTuples() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { storeId: string; tuples: TupleRecord[] }) =>
      ofgaFetch<{ ok: true; written: number }>("/tuples", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ofga", "tuples"] }),
  })
}

export function useDeleteTuples() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { storeId: string; tuples: TupleRecord[] }) =>
      ofgaFetch<{ ok: true; deleted: number }>("/tuples", {
        method: "DELETE",
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ofga", "tuples"] }),
  })
}

export function useChanges(storeId: string, filter: { type?: string; continuationToken?: string }) {
  return useQuery({
    queryKey: ["ofga", "changes", storeId, filter],
    queryFn: () => ofgaFetch<ChangesPage>(`/changes${buildQuery({ storeId, ...filter })}`),
    enabled: Boolean(storeId),
  })
}

export type ExploreResult =
  | { kind: "check"; allowed: boolean }
  | { kind: "listObjects"; objects: string[] }
  | { kind: "listUsers"; users: string[] }

export function useExplore() {
  return useMutation({
    mutationFn: (input: Record<string, string>) =>
      ofgaFetch<ExploreResult>("/explore", { method: "POST", body: JSON.stringify(input) }),
  })
}
