"use client"

import { Badge } from "@workspace/ui/components/badge"
import { useMemo } from "react"
import type { ModelJson, ModelTypeDefinition } from "@/lib/ofga-client"

type TypeRelations = { type: string; added: string[]; removed: string[] }

type DiffResult = {
  addedTypes: string[]
  removedTypes: string[]
  relationChanges: TypeRelations[]
}

function relationNames(definition: ModelTypeDefinition | undefined): Set<string> {
  return new Set(Object.keys(definition?.relations ?? {}))
}

function byType(model: ModelJson): Map<string, ModelTypeDefinition> {
  return new Map((model.type_definitions ?? []).map((definition) => [definition.type, definition]))
}

export function computeModelDiff(base: ModelJson, compare: ModelJson): DiffResult {
  const baseTypes = byType(base)
  const compareTypes = byType(compare)

  const addedTypes: string[] = []
  const removedTypes: string[] = []
  const relationChanges: TypeRelations[] = []

  for (const type of compareTypes.keys()) {
    if (!baseTypes.has(type)) addedTypes.push(type)
  }
  for (const type of baseTypes.keys()) {
    if (!compareTypes.has(type)) removedTypes.push(type)
  }

  for (const [type, baseDefinition] of baseTypes) {
    const compareDefinition = compareTypes.get(type)
    if (!compareDefinition) continue
    const before = relationNames(baseDefinition)
    const after = relationNames(compareDefinition)
    const added = [...after].filter((relation) => !before.has(relation))
    const removed = [...before].filter((relation) => !after.has(relation))
    if (added.length > 0 || removed.length > 0) {
      relationChanges.push({ type, added, removed })
    }
  }

  return { addedTypes, removedTypes, relationChanges }
}

export function ModelDiff({ base, compare }: { base: ModelJson; compare: ModelJson }) {
  const diff = useMemo(() => computeModelDiff(base, compare), [base, compare])
  const empty =
    diff.addedTypes.length === 0 &&
    diff.removedTypes.length === 0 &&
    diff.relationChanges.length === 0

  if (empty) {
    return <p className="text-sm text-muted-foreground">The two models are equivalent.</p>
  }

  return (
    <div className="space-y-6">
      <Section title="Types">
        {diff.addedTypes.map((type) => (
          <Badge key={`added-${type}`} variant="default">
            + {type}
          </Badge>
        ))}
        {diff.removedTypes.map((type) => (
          <Badge key={`removed-${type}`} variant="destructive">
            − {type}
          </Badge>
        ))}
        {diff.addedTypes.length === 0 && diff.removedTypes.length === 0 ? (
          <span className="text-sm text-muted-foreground">No type changes.</span>
        ) : null}
      </Section>

      <Section title="Relations">
        {diff.relationChanges.length === 0 ? (
          <span className="text-sm text-muted-foreground">No relation changes.</span>
        ) : (
          diff.relationChanges.map((change) => (
            <div key={change.type} className="w-full space-y-1">
              <p className="text-sm font-medium">{change.type}</p>
              <div className="flex flex-wrap gap-1">
                {change.added.map((relation) => (
                  <Badge key={`${change.type}-a-${relation}`} variant="default">
                    + {relation}
                  </Badge>
                ))}
                {change.removed.map((relation) => (
                  <Badge key={`${change.type}-r-${relation}`} variant="destructive">
                    − {relation}
                  </Badge>
                ))}
              </div>
            </div>
          ))
        )}
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}
