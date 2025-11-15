"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { renderHtml } from "@/lib/template-utils"
import { Loader2, Eye, FileText } from "lucide-react"
import type { FieldDef } from "@/lib/template-utils"

interface Template {
  id: string
  name: string
  html_content?: string
  version?: number
}

interface TemplateFormProps {
  template: Template
  fields: FieldDef[]
}

export function TemplateForm({ template, fields }: TemplateFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {}
    fields.forEach((field) => {
      if (field.default_value) {
        initial[field.field_id] = field.default_value
      }
    })
    return initial
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [livePreviewHtml, setLivePreviewHtml] = useState<string>("")
  const [viewMode, setViewMode] = useState<"form" | "split" | "preview">("split")

  // Update live preview whenever form data changes
  useEffect(() => {
    if (template.html_content) {
      const rendered = renderHtml(template.html_content, formData)
      setLivePreviewHtml(rendered)
    }
  }, [formData, template.html_content])

  const updateField = (fieldId: string, value: any) => {
    setFormData({ ...formData, [fieldId]: value })
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors({ ...errors, [fieldId]: "" })
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    fields.forEach((field) => {
      const value = formData[field.field_id]

      if (field.required && (!value || (typeof value === "string" && value.trim() === ""))) {
        newErrors[field.field_id] = `${field.label || field.field_id} is required`
      }

      if (value && field.type === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          newErrors[field.field_id] = "Please enter a valid email address"
        }
      }

      if (value && field.type === "number") {
        if (isNaN(Number(value))) {
          newErrors[field.field_id] = "Please enter a valid number"
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) {
      return
    }

    setIsSubmitting(true)
    try {
      // Save submission
      const submissionResponse = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: template.id,
          template_version: template.version || 1,
          data: formData,
        }),
      })

      if (!submissionResponse.ok) {
        throw new Error("Failed to save submission")
      }

      alert("Form submitted successfully! You can now download your template.")
    } catch (error) {
      alert("Error submitting form: " + (error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([livePreviewHtml], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${template.name.replace(/\s+/g, "_")}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderField = (field: FieldDef) => {
    const value = formData[field.field_id] || ""
    const error = errors[field.field_id]

    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            id={field.field_id}
            value={value}
            onChange={(e) => updateField(field.field_id, e.target.value)}
            placeholder={field.help || `Enter ${field.label || field.field_id}`}
            required={field.required}
            className={error ? "border-red-500" : ""}
          />
        )

      case "select":
        const options = Array.isArray(field.options) ? field.options : []
        return (
          <Select value={value} onValueChange={(val) => updateField(field.field_id, val)}>
            <SelectTrigger className={error ? "border-red-500" : ""}>
              <SelectValue placeholder={`Select ${field.label || field.field_id}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt, idx) => {
                const optionValue = typeof opt === "string" ? opt : opt.value || opt.label
                const optionLabel = typeof opt === "string" ? opt : opt.label || opt.value
                return (
                  <SelectItem key={idx} value={optionValue}>
                    {optionLabel}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        )

      case "checkbox":
        const checkboxOptions = Array.isArray(field.options) ? field.options : []
        if (checkboxOptions.length > 0) {
          // Multiple checkboxes
          return (
            <div className="space-y-2">
              {checkboxOptions.map((opt, idx) => {
                const optionValue = typeof opt === "string" ? opt : opt.value || opt.label
                const optionLabel = typeof opt === "string" ? opt : opt.label || opt.value
                const checked = Array.isArray(value) ? value.includes(optionValue) : false
                return (
                  <div key={idx} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${field.field_id}-${idx}`}
                      checked={checked}
                      onCheckedChange={(checked) => {
                        const current = Array.isArray(value) ? value : []
                        if (checked) {
                          updateField(field.field_id, [...current, optionValue])
                        } else {
                          updateField(
                            field.field_id,
                            current.filter((v) => v !== optionValue)
                          )
                        }
                      }}
                    />
                    <Label htmlFor={`${field.field_id}-${idx}`} className="cursor-pointer">
                      {optionLabel}
                    </Label>
                  </div>
                )
              })}
            </div>
          )
        } else {
          // Single checkbox
          return (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.field_id}
                checked={!!value}
                onCheckedChange={(checked) => updateField(field.field_id, checked ? "Yes" : "")}
              />
              <Label htmlFor={field.field_id} className="cursor-pointer">
                {field.label || field.field_id}
              </Label>
            </div>
          )
        }

      default:
        return (
          <Input
            id={field.field_id}
            type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
            value={value}
            onChange={(e) => updateField(field.field_id, e.target.value)}
            placeholder={field.help || `Enter ${field.label || field.field_id}`}
            required={field.required}
            className={error ? "border-red-500" : ""}
          />
        )
    }
  }

  if (fields.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>{template.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              This template has no fields configured. Please contact the administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formContent = (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        handleSubmit()
      }}
      className="space-y-6"
    >
      {fields.map((field) => (
        <div key={field.field_id}>
          <Label htmlFor={field.field_id}>
            {field.label || field.field_id}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {renderField(field)}
          {field.help && <p className="text-sm text-muted-foreground mt-1">{field.help}</p>}
          {errors[field.field_id] && <p className="text-sm text-red-500 mt-1">{errors[field.field_id]}</p>}
        </div>
      ))}

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit"
          )}
        </Button>
        <Button type="button" variant="outline" onClick={handleDownload}>
          Download HTML
        </Button>
        <Button type="button" variant="outline" onClick={() => window.print()}>
          Print
        </Button>
      </div>
    </form>
  )

  const previewContent = (
    <div className="border rounded-lg p-6 bg-white min-h-[600px] overflow-auto">
      {livePreviewHtml ? (
        <div dangerouslySetInnerHTML={{ __html: livePreviewHtml }} />
      ) : (
        <p className="text-muted-foreground text-center py-8">Fill in the form to see the preview</p>
      )}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{template.name}</h1>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "form" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("form")}
          >
            <FileText className="w-4 h-4 mr-2" />
            Form Only
          </Button>
          <Button
            variant={viewMode === "split" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("split")}
          >
            <Eye className="w-4 h-4 mr-2" />
            Split View
          </Button>
          <Button
            variant={viewMode === "preview" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("preview")}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview Only
          </Button>
        </div>
      </div>

      {viewMode === "form" && (
        <Card>
          <CardHeader>
            <CardTitle>Fill Template Fields</CardTitle>
          </CardHeader>
          <CardContent>{formContent}</CardContent>
        </Card>
      )}

      {viewMode === "split" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Fill Template Fields</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[800px] overflow-y-auto">{formContent}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[800px] overflow-y-auto">{previewContent}</CardContent>
          </Card>
        </div>
      )}

      {viewMode === "preview" && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>{previewContent}</CardContent>
        </Card>
      )}
    </div>
  )
}

