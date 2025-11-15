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
import { Eye, EyeOff, ShoppingCart } from "lucide-react"
import type { FieldDef } from "@/lib/template-utils"
import Link from "next/link"

interface TemplateDetailPreviewProps {
  template: {
    id: string
    name: string
    html_content?: string
    price: number
  }
  fields: FieldDef[]
}

export function TemplateDetailPreview({ template, fields }: TemplateDetailPreviewProps) {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {}
    fields.forEach((field) => {
      if (field.default_value) {
        initial[field.field_id] = field.default_value
      } else {
        // Generate sample data for preview
        switch (field.type) {
          case "email":
            initial[field.field_id] = "example@email.com"
            break
          case "phone":
            initial[field.field_id] = "+1234567890"
            break
          case "date":
            initial[field.field_id] = new Date().toISOString().split("T")[0]
            break
          case "number":
            initial[field.field_id] = "100"
            break
          case "checkbox":
            initial[field.field_id] = "Yes"
            break
          default:
            initial[field.field_id] = `Sample ${field.label || field.field_id}`
        }
      }
    })
    return initial
  })
  const [livePreviewHtml, setLivePreviewHtml] = useState<string>("")
  const [showFields, setShowFields] = useState(true)

  // Update live preview whenever form data changes
  useEffect(() => {
    if (template.html_content) {
      const rendered = renderHtml(template.html_content, formData)
      setLivePreviewHtml(rendered)
    }
  }, [formData, template.html_content])

  const updateField = (fieldId: string, value: any) => {
    setFormData({ ...formData, [fieldId]: value })
  }

  const renderField = (field: FieldDef) => {
    const value = formData[field.field_id] || ""

    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            id={field.field_id}
            value={value}
            onChange={(e) => updateField(field.field_id, e.target.value)}
            placeholder={field.help || `Enter ${field.label || field.field_id}`}
            rows={3}
          />
        )

      case "select":
        const options = Array.isArray(field.options) ? field.options : []
        return (
          <Select value={value} onValueChange={(val) => updateField(field.field_id, val)}>
            <SelectTrigger>
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
                    <Label htmlFor={`${field.field_id}-${idx}`} className="cursor-pointer text-sm">
                      {optionLabel}
                    </Label>
                  </div>
                )
              })}
            </div>
          )
        } else {
          return (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.field_id}
                checked={!!value}
                onCheckedChange={(checked) => updateField(field.field_id, checked ? "Yes" : "")}
              />
              <Label htmlFor={field.field_id} className="cursor-pointer text-sm">
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
          />
        )
    }
  }

  return (
    <div className="relative">
      {/* Preview Section */}
      <div className="mb-6">
        <Card className="overflow-hidden bg-white">
          <div className="border rounded-lg p-6 min-h-[600px] overflow-auto">
            {livePreviewHtml ? (
              <div dangerouslySetInnerHTML={{ __html: livePreviewHtml }} />
            ) : template.html_content ? (
              <div dangerouslySetInnerHTML={{ __html: template.html_content }} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No preview available
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Fields Panel - Collapsible */}
      {fields.length > 0 && (
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowFields(!showFields)}
            className="mb-4 w-full sm:w-auto"
          >
            {showFields ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Hide Customization Fields
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Show Customization Fields
              </>
            )}
          </Button>

          {showFields && (
            <Card>
              <CardHeader>
                <CardTitle>Try It Out - Customize Your Template</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Change the values below to see how your template will look with your own data
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fields.map((field) => (
                    <div key={field.field_id} className="space-y-2">
                      <Label htmlFor={field.field_id} className="text-sm font-medium">
                        {field.label || field.field_id}
                      </Label>
                      {renderField(field)}
                      {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Floating Buy Button */}
      <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-4">
        <Card className="shadow-lg backdrop-blur-sm bg-background/95">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Price</p>
            <p className="text-2xl font-bold text-primary mb-3">₹{template.price}</p>
            <Link href={`/template/${template.id}/checkout`}>
              <Button size="lg" className="w-full gap-2">
                <ShoppingCart className="w-5 h-5" />
                Buy Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
