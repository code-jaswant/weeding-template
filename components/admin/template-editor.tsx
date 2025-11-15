"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FieldManager } from "./field-manager"
import { TemplatePreview } from "./template-preview"
import { Save, ArrowLeft, RefreshCw } from "lucide-react"
import type { FieldDef } from "@/lib/template-utils"

interface Template {
  id: string
  name: string
  html_content?: string
  version?: number
}

interface TemplateEditorProps {
  template: Template
  initialFields: FieldDef[]
}

export function TemplateEditor({ template, initialFields }: TemplateEditorProps) {
  const router = useRouter()
  const [htmlContent, setHtmlContent] = useState(template.html_content || "")
  const [fields, setFields] = useState<FieldDef[]>(initialFields)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [previewData, setPreviewData] = useState<Record<string, any>>({})

  // Generate preview data from fields
  useEffect(() => {
    const data: Record<string, any> = {}
    fields.forEach((field) => {
      if (field.default_value) {
        data[field.field_id] = field.default_value
      } else {
        // Generate sample data based on type
        switch (field.type) {
          case "email":
            data[field.field_id] = "example@email.com"
            break
          case "phone":
            data[field.field_id] = "+1234567890"
            break
          case "date":
            data[field.field_id] = new Date().toISOString().split("T")[0]
            break
          case "number":
            data[field.field_id] = "100"
            break
          case "checkbox":
            data[field.field_id] = "Yes"
            break
          default:
            data[field.field_id] = `Sample ${field.label || field.field_id}`
        }
      }
    })
    setPreviewData(data)
  }, [fields])

  const handleSyncFields = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch(`/api/templates/${template.id}/sync-fields`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to sync fields")
      }

      const result = await response.json()
      setFields(result.fields || [])
      alert(`Synced fields: ${result.created} created, ${result.removed} removed`)
    } catch (error) {
      alert("Error syncing fields: " + (error as Error).message)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSaveTemplate = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: template.id,
          html_content: htmlContent,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save template")
      }

      alert("Template saved successfully!")
    } catch (error) {
      alert("Error saving template: " + (error as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveFields = async (updatedFields: FieldDef[]) => {
    try {
      const response = await fetch(`/api/templates/${template.id}/fields`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: updatedFields }),
      })

      if (!response.ok) {
        throw new Error("Failed to save fields")
      }

      const result = await response.json()
      setFields(result.fields || [])
      alert("Fields saved successfully!")
    } catch (error) {
      alert("Error saving fields: " + (error as Error).message)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/admin")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Edit Template: {template.name}</h1>
          {template.version && <span className="text-sm text-muted-foreground">v{template.version}</span>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSyncFields} disabled={isSyncing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
            Sync Fields
          </Button>
          <Button onClick={handleSaveTemplate} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="html" className="space-y-6">
        <TabsList>
          <TabsTrigger value="html">HTML Editor</TabsTrigger>
          <TabsTrigger value="fields">Field Management</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="html">
          <Card>
            <CardHeader>
              <CardTitle>HTML Template</CardTitle>
              <p className="text-sm text-muted-foreground">
                Use <code className="bg-muted px-1 rounded">{`{{field_id}}`}</code> syntax for placeholders
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="Enter your HTML template with placeholders like {{student_name}}, {{course_title}}, etc."
                className="font-mono text-sm min-h-[600px]"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields">
          <FieldManager fields={fields} onSave={handleSaveFields} />
        </TabsContent>

        <TabsContent value="preview">
          <TemplatePreview html={htmlContent} data={previewData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

