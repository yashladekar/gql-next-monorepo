"use client"

import Editor from "@monaco-editor/react"

export function DslEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="h-[440px] overflow-hidden rounded-lg border">
      <Editor
        height="100%"
        defaultLanguage="plaintext"
        theme="vs-dark"
        value={value}
        onChange={(next) => onChange(next ?? "")}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          scrollBeyondLastLine: false,
          tabSize: 2,
          renderWhitespace: "selection",
        }}
      />
    </div>
  )
}
