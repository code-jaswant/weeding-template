"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Save, Plus, Trash2, GripVertical } from "lucide-react"
import type { FieldDef } from "@/lib/template-utils"

interface FieldManagerProps {
  fields: FieldDef[]
  onSave: (fields: FieldDef[]) => void
}

const FIELD_TYPES: FieldDef["type"][] = [
  "text",
  "textarea",
  "number",
  "date",
  "email",
  "phone",
  "select",
  "checkbox",
]

export function FieldManager({ fields: initialFields, onSave }: FieldManagerProps) {
  const [fields, setFields] = useState<FieldDef[]>(initialFields)
  const [isSaving, setIsSaving] = useState(false)

  const updateField = (index: number, updates: Partial<FieldDef>) => {
    const updated = [...fields]
    updated[index] = { ...updated[index], ...updates }
    setFields(updated)
  }

  const removeField = (index: number) => {
    if (confirm("Are you sure you want to remove this field?")) {
      setFields(fields.filter((_, i) => i !== index))
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(fields)
    } finally {
      setIsSaving(false)
    }
  }

  const parseOptions = (options: any): string[] => {
    if (!options) return []
    if (Array.isArray(options)) {
      return options.map((opt) => (typeof opt === "string" ? opt : opt.value || opt.label))
    }
    return []
  }

  const formatOptions = (options: any): string => {
    if (!options) return ""
    if (Array.isArray(options)) {
      return options.map((opt) => (typeof opt === "string" ? opt : opt.value || opt.label)).join("\n")
    }
    return ""
  }

  const updateOptions = (index: number, value: string) => {
    const options = value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
    updateField(index, { options: options.length > 0 ? options : null })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Template Fields</CardTitle>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Fields"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No fields found. Sync fields from HTML template.</p>
          ) : (
            <div className="space-y-6">
              {fields.map((field, index) => (
                <Card key={field.id || index}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Field ID</Label>
                        <Input value={field.field_id} disabled className="font-mono" />
                        <p className="text-xs text-muted-foreground mt-1">Cannot be changed</p>
                      </div>

                      <div>
                        <Label>Label *</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(index, { label: e.target.value })}
                          placeholder="Display label for this field"
                        />
                      </div>

                      <div>
                        <Label>Type *</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value) => updateField(index, { type: value as FieldDef["type"] })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2 pt-6">
                        <Checkbox
                          id={`required-${index}`}
                          checked={field.required}
                          onCheckedChange={(checked) => updateField(index, { required: !!checked })}
                        />
                        <Label htmlFor={`required-${index}`} className="cursor-pointer">
                          Required
                        </Label>
                      </div>

                      <div>
                        <Label>Default Value</Label>
                        <Input
                          value={field.default_value || ""}
                          onChange={(e) => updateField(index, { default_value: e.target.value || undefined })}
                          placeholder="Optional default value"
                        />
                      </div>

                      <div>
                        <Label>Order Index</Label>
                        <Input
                          type="number"
                          value={field.order_index}
                          onChange={(e) => updateField(index, { order_index: parseInt(e.target.value) || 0 })}
                        />
                      </div>

                      {(field.type === "select" || field.type === "checkbox") && (
                        <div className="md:col-span-2">
                          <Label>Options (one per line)</Label>
                          <Textarea
                            value={formatOptions(field.options)}
                            onChange={(e) => updateOptions(index, e.target.value)}
                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                            rows={4}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Enter each option on a new line. For select/checkbox fields.
                          </p>
                        </div>
                      )}

                      <div className="md:col-span-2">
                        <Label>Help Text</Label>
                        <Textarea
                          value={field.help || ""}
                          onChange={(e) => updateField(index, { help: e.target.value || undefined })}
                          placeholder="Optional help text to show users"
                          rows={2}
                        />
                      </div>

                      <div className="md:col-span-2 flex justify-end">
                        <Button variant="destructive" size="sm" onClick={() => removeField(index)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove Field
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

