"use client"

import {
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useMemo } from "react"
import type { ModelJson, ModelTypeDefinition } from "@/lib/ofga-client"

type DirectType = { type: string; relation?: string }
type RelationMetadata = { directly_related_user_types?: DirectType[] }

function metadataFor(definition: ModelTypeDefinition): Record<string, RelationMetadata> {
  const metadata = definition.metadata as { relations?: Record<string, RelationMetadata> } | undefined
  return metadata?.relations ?? {}
}

function buildGraph(model: ModelJson): { nodes: Node[]; edges: Edge[] } {
  const definitions = model.type_definitions ?? []
  const nodeIds = new Set(definitions.map((definition) => definition.type))

  const nodes: Node[] = definitions.map((definition, index) => ({
    id: definition.type,
    position: { x: (index % 4) * 260, y: Math.floor(index / 4) * 160 },
    data: {
      label: `${definition.type}\n${Object.keys(definition.relations ?? {}).length} relations`,
    },
    style: {
      width: 180,
      padding: 8,
      borderRadius: 8,
      border: "1px solid var(--border)",
      background: "var(--card)",
      color: "var(--card-foreground)",
      fontSize: 12,
      textAlign: "center" as const,
      whiteSpace: "pre-line" as const,
    },
  }))

  const edges: Edge[] = []
  const seen = new Set<string>()

  for (const definition of definitions) {
    const metadata = metadataFor(definition)
    for (const [relation, relationMetadata] of Object.entries(metadata)) {
      for (const direct of relationMetadata.directly_related_user_types ?? []) {
        if (!nodeIds.has(direct.type)) continue
        const id = `${definition.type}:${relation}->${direct.type}`
        if (seen.has(id)) continue
        seen.add(id)
        edges.push({
          id,
          source: definition.type,
          target: direct.type,
          label: relation,
          animated: false,
          style: { fontSize: 11 },
        })
      }
    }
  }

  return { nodes, edges }
}

export function ModelGraph({ model }: { model: ModelJson }) {
  const { nodes, edges } = useMemo(() => buildGraph(model), [model])

  return (
    <div className="h-[520px] overflow-hidden rounded-lg border">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}
