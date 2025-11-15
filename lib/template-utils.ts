export interface FieldDef {
  id?: string
  template_id: string
  field_id: string
  label: string
  type: "text" | "email" | "tel" | "number" | "textarea" | "select" | "checkbox" | "date"
  required: boolean
  placeholder?: string
  default_value?: string
  options?: string
  help_text?: string
  order_index: number
  validation_regex?: string
  validation_message?: string
}

export function extractFieldIds(html: string): string[] {
  const regex = /{{(\w+)}}/g
  const matches: string[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(html)) !== null) {
    const fieldId = match[1]
    if (!matches.includes(fieldId)) {
      matches.push(fieldId)
    }
  }

  return matches
}

export function renderHtml(html: string, data: Record<string, any>): string {
  let rendered = html

  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    rendered = rendered.replace(regex, String(value || ''))
  })

  return rendered
}

export function syncFields(
  existingFields: Array<{ id: string; field_id: string }>,
  extractedIds: string[]
): { toCreate: string[]; toRemove: string[] } {
  const existingFieldIds = existingFields.map((f) => f.field_id)

  const toCreate = extractedIds.filter((id) => !existingFieldIds.includes(id))

  const toRemove = existingFields
    .filter((field) => !extractedIds.includes(field.field_id))
    .map((field) => field.id)

  return { toCreate, toRemove }
}

export function getDefaultFieldDef(fieldId: string): Partial<FieldDef> {
  const label = fieldId
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  let type: FieldDef["type"] = "text"
  let placeholder = ""

  if (fieldId.includes("email")) {
    type = "email"
    placeholder = "example@email.com"
  } else if (fieldId.includes("phone") || fieldId.includes("tel")) {
    type = "tel"
    placeholder = "+1234567890"
  } else if (fieldId.includes("number") || fieldId.includes("age") || fieldId.includes("quantity")) {
    type = "number"
    placeholder = "0"
  } else if (fieldId.includes("date") || fieldId.includes("birth")) {
    type = "date"
  } else if (fieldId.includes("description") || fieldId.includes("message") || fieldId.includes("address")) {
    type = "textarea"
    placeholder = `Enter ${label.toLowerCase()}`
  }

  return {
    field_id: fieldId,
    label,
    type,
    required: true,
    placeholder,
  }
}
