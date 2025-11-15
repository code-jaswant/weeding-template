"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { renderHtml } from "@/lib/template-utils"

interface TemplatePreviewProps {
  html: string
  data: Record<string, any>
}

export function TemplatePreview({ html, data: initialData }: TemplatePreviewProps) {
  const [previewData, setPreviewData] = useState(initialData)
  const [renderedHtml, setRenderedHtml] = useState("")

  useEffect(() => {
    const rendered = renderHtml(html, previewData)
    setRenderedHtml(rendered)
  }, [html, previewData])

  const updateField = (fieldId: string, value: string) => {
    setPreviewData({ ...previewData, [fieldId]: value })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Preview Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.keys(previewData).length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No fields to preview</p>
          ) : (
            Object.entries(previewData).map(([fieldId, value]) => (
              <div key={fieldId}>
                <Label htmlFor={fieldId}>{fieldId}</Label>
                <Input
                  id={fieldId}
                  value={value || ""}
                  onChange={(e) => updateField(fieldId, e.target.value)}
                  placeholder={`Enter ${fieldId}`}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rendered Output</CardTitle>
        </CardHeader>
        <CardContent>
          {renderedHtml ? (
            <div
              className="border rounded-lg p-6 bg-white min-h-[400px]"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          ) : (
            <p className="text-muted-foreground text-center py-8">No HTML to preview</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

