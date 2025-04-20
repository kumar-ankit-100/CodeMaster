"use client"

import React from "react"
import { useRef } from "react"
import Editor from "@monaco-editor/react"

interface CodeEditorProps {
  code: string
  setCode: (code: string) => void
}

export default function CodeEditor({ code, setCode }: CodeEditorProps) {
  const editorRef = useRef(null)

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor
  }

  return (
    <div className="h-[500px] relative">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        defaultValue={code}
        onChange={(value) => setCode(value)}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16 },
          lineNumbers: "on",
          glyphMargin: false,
          folding: true,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 3,
        }}
      />
    </div>
  )
}

