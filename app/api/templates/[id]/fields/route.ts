import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET - Fetch fields for a template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: fields, error } = await supabase
      .from("template_fields")
      .select("*")
      .eq("template_id", id)
      .order("order_index", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ fields: fields || [] })
  } catch (error) {
    console.error("Error fetching fields:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Bulk update fields
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or template owner
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()
    const { data: template } = await supabase.from("templates").select("created_by").eq("id", id).single()

    if (!profile?.is_admin && template?.created_by !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { fields } = body

    if (!Array.isArray(fields)) {
      return NextResponse.json({ error: "Fields must be an array" }, { status: 400 })
    }

    // Verify all fields belong to this template (security check)
    if (fields.length > 0) {
      const fieldIds = fields.map((f: any) => f.id).filter((id: any) => id)
      if (fieldIds.length > 0) {
        const { data: existingFields, error: checkError } = await supabase
          .from("template_fields")
          .select("id, template_id")
          .in("id", fieldIds)

        if (checkError) {
          return NextResponse.json({ error: "Failed to verify field ownership" }, { status: 500 })
        }

        const wrongTemplateFields = existingFields?.filter((f) => f.template_id !== id) || []
        if (wrongTemplateFields.length > 0) {
          console.error("[Fields API] Security violation: Attempted to update fields from different template")
          return NextResponse.json(
            { error: "Cannot update fields from different template. All fields must belong to this template." },
            { status: 403 }
          )
        }
      }
    }

    // Update each field - ensure template_id and field_id are set correctly
    const updates = fields.map((field: any) => ({
      id: field.id,
      template_id: id, // CRITICAL: Ensure field belongs to this template
      field_id: field.field_id, // CRITICAL: field_id is NOT NULL
      label: field.label,
      type: field.type,
      required: field.required || false,
      options: field.options || null,
      default_value: field.default_value || null,
      order_index: field.order_index || 0,
      help: field.help || null,
      updated_at: new Date().toISOString(),
    }))

    // Use upsert to update existing fields
    const { data: updatedFields, error } = await supabase
      .from("template_fields")
      .upsert(updates, { onConflict: "id" })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ fields: updatedFields || [] })
  } catch (error) {
    console.error("Error updating fields:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

