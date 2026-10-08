"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { NativeSelect, NativeSelectOption } from "@workspace/ui/components/native-select"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"
import { ModelDiff } from "@/components/model-diff"
import { useStore } from "@/components/store-provider"
import { useModel, useModels, useValidateDsl, useWriteModel } from "@/hooks/use-ofga"
import type { ModelJson, ModelSummary } from "@/lib/ofga-client"

const DslEditor = dynamic(
  () => import("@/components/dsl-editor").then((module) => module.DslEditor),
  { ssr: false, loading: () => <EditorPlaceholder /> },
)
const ModelGraph = dynamic(
  () => import("@/components/model-graph").then((module) => module.ModelGraph),
  { ssr: false, loading: () => <EditorPlaceholder /> },
)

const TEMPLATE_DSL = `model
  schema 1.1

type user

type document
  relations
    define owner: [user]
    define viewer: [user]
    define can_view: viewer or owner
`

function EditorPlaceholder() {
  return (
    <div className="flex h-[440px] items-center justify-center rounded-lg border text-sm text-muted-foreground">
      <Spinner className="mr-2 size-4" /> Loading editor…
    </div>
  )
}

function shortId(id: string) {
  return id.length > 14 ? `${id.slice(0, 14)}…` : id
}

export default function ModelsPage() {
  const { storeId } = useStore()
  const { data: models, isPending, error } = useModels(storeId)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedId && models && models.length > 0) setSelectedId(models[0]!.id)
  }, [models, selectedId])

  const { data: modelData, isPending: modelLoading } = useModel(storeId, selectedId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Authorization Models</h1>
        <p className="text-sm text-muted-foreground">
          Author, inspect and diff the model versions in the selected store.
        </p>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load models"}
          </CardContent>
        </Card>
      ) : null}

      <ComposeCard
        storeId={storeId}
        seedDsl={modelData?.dsl}
        seedFor={selectedId}
        onWritten={setSelectedId}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Versions</CardTitle>
          <CardDescription>{models?.length ?? 0} model(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Spinner className="size-4" /> Loading…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model ID</TableHead>
                  <TableHead>Schema</TableHead>
                  <TableHead>Types</TableHead>
                  <TableHead>Relations</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(models ?? []).map((model) => (
                  <TableRow key={model.id}>
                    <TableCell className="font-mono text-xs">{model.id}</TableCell>
                    <TableCell>{model.schemaVersion}</TableCell>
                    <TableCell>{model.typeCount}</TableCell>
                    <TableCell>{model.relationCount}</TableCell>
                    <TableCell className="text-right">
                      {model.id === selectedId ? (
                        <Badge variant="secondary">Selected</Badge>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setSelectedId(model.id)}>
                          Open
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {models && models.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                      No models in this store yet — write one above.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedId ? (
        modelLoading || !modelData ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="size-4" /> Loading model…
          </div>
        ) : (
          <ModelDetail
            key={selectedId}
            storeId={storeId}
            modelId={selectedId}
            model={modelData.model}
            models={models ?? []}
          />
        )
      ) : null}
    </div>
  )
}

function ComposeCard({
  storeId,
  seedDsl,
  seedFor,
  onWritten,
}: {
  storeId: string
  seedDsl?: string
  seedFor: string | null
  onWritten: (modelId: string) => void
}) {
  const [draft, setDraft] = useState(seedDsl ?? TEMPLATE_DSL)
  const seedRef = useRef<string | null>(null)
  const validate = useValidateDsl()
  const writeModel = useWriteModel()

  // Seed the editor whenever a different model is selected (or its DSL arrives).
  useEffect(() => {
    if (!seedDsl || seedRef.current === seedFor) return
    seedRef.current = seedFor
    setDraft(seedDsl)
  }, [seedDsl, seedFor])

  function onWrite() {
    if (!window.confirm("Writing creates a new model version. Continue?")) return
    writeModel.mutate(
      { storeId, dsl: draft },
      { onSuccess: (result) => onWritten(result.modelId) },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Compose model</CardTitle>
        <CardDescription>
          Write FGA DSL and publish it as a new model version
          {storeId ? ` in ${shortId(storeId)}` : ""}. Leave it empty only if no store is selected.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <DslEditor value={draft} onChange={setDraft} />
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => validate.mutate(draft)} disabled={validate.isPending}>
            {validate.isPending ? <Spinner className="size-4" /> : null}
            Validate
          </Button>
          <Button onClick={onWrite} disabled={writeModel.isPending || !storeId || !draft.trim()}>
            {writeModel.isPending ? <Spinner className="size-4" /> : null}
            Write new version
          </Button>
          <Button variant="ghost" onClick={() => setDraft(TEMPLATE_DSL)}>
            Reset
          </Button>
          {validate.data ? (
            <Badge variant={validate.data.valid ? "default" : "destructive"}>
              {validate.data.valid ? "valid DSL" : "invalid DSL"}
            </Badge>
          ) : null}
          {validate.data?.error ? (
            <span className="text-xs text-destructive">{validate.data.error}</span>
          ) : null}
          {writeModel.error ? (
            <span className="text-xs text-destructive">
              {writeModel.error instanceof Error ? writeModel.error.message : "Write failed"}
            </span>
          ) : null}
          {writeModel.isSuccess ? (
            <Badge variant="secondary">wrote {shortId(writeModel.data.modelId)}</Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function ModelDetail({
  storeId,
  modelId,
  model,
  models,
}: {
  storeId: string
  modelId: string
  model: ModelJson
  models: ModelSummary[]
}) {
  const otherModels = models.filter((candidate) => candidate.id !== modelId)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Model {shortId(modelId)}</CardTitle>
        <CardDescription>Schema {model.schema_version}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="json">
          <TabsList>
            <TabsTrigger value="json">JSON</TabsTrigger>
            <TabsTrigger value="graph">Graph</TabsTrigger>
            <TabsTrigger value="diff">Diff</TabsTrigger>
          </TabsList>

          <TabsContent value="json" className="pt-4">
            <ScrollArea className="h-[440px] rounded-lg border">
              <pre className="p-4 text-xs">{JSON.stringify(model, null, 2)}</pre>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="graph" className="pt-4">
            <ModelGraph model={model} />
          </TabsContent>

          <TabsContent value="diff" className="pt-4">
            <DiffTab storeId={storeId} currentModel={model} otherModels={otherModels} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function DiffTab({
  storeId,
  currentModel,
  otherModels,
}: {
  storeId: string
  currentModel: ModelJson
  otherModels: ModelSummary[]
}) {
  const [compareId, setCompareId] = useState(otherModels[0]?.id ?? "")
  const { data } = useModel(storeId, compareId || null)

  if (otherModels.length === 0) {
    return <p className="text-sm text-muted-foreground">Only one model version exists.</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Compare current with</span>
        <NativeSelect value={compareId} onChange={(event) => setCompareId(event.target.value)}>
          {otherModels.map((candidate) => (
            <NativeSelectOption key={candidate.id} value={candidate.id}>
              {candidate.id}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      {data ? (
        <ModelDiff base={data.model} compare={currentModel} />
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="size-4" /> Loading…
        </div>
      )}
    </div>
  )
}
