import { createClient } from "@/lib/supabase/server"
import { extractFieldIds, syncFields, getDefaultFieldDef } from "@/lib/template-utils"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("[Sync Fields] ===== START SYNC FIELDS =====")
  try {
    const { id } = await params
    console.log("[Sync Fields] Template ID:", id)
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    console.log("[Sync Fields] Auth check - User:", user?.id || "null", "Error:", authError?.message || "none")
    
    if (!user) {
      console.error("[Sync Fields] ERROR: Unauthorized - no user")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or template owner
    console.log("[Sync Fields] Checking user permissions...")
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()
    
    console.log("[Sync Fields] Profile check - is_admin:", profile?.is_admin, "Error:", profileError?.message || "none")
    
    const { data: template, error: templateCheckError } = await supabase
      .from("templates")
      .select("created_by")
      .eq("id", id)
      .single()
    
    console.log("[Sync Fields] Template ownership check - created_by:", template?.created_by, "Error:", templateCheckError?.message || "none")

    if (!profile?.is_admin && template?.created_by !== user.id) {
      console.error("[Sync Fields] ERROR: Forbidden - user is not admin and not template owner")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    console.log("[Sync Fields] ✓ Permission check passed")

    // Get template HTML
    // Note: version column might not exist if script 010 hasn't been run yet
    console.log("[Sync Fields] Fetching template data...")
    const { data: templateData, error: templateError } = await supabase
      .from("templates")
      .select("html_content, name")
      .eq("id", id)
      .single()

    if (templateError) {
      console.error("[Sync Fields] ERROR: Template fetch failed")
      console.error("[Sync Fields] Error code:", templateError.code)
      console.error("[Sync Fields] Error message:", templateError.message)
      console.error("[Sync Fields] Error details:", templateError.details)
      console.error("[Sync Fields] Error hint:", templateError.hint)
      return NextResponse.json(
        { error: "Template not found", details: templateError.message },
        { status: 404 }
      )
    }

    console.log("[Sync Fields] Template data fetched - Name:", templateData?.name || "null")
    console.log("[Sync Fields] Template data - Has html_content:", !!templateData?.html_content)
    console.log("[Sync Fields] Template data - html_content type:", typeof templateData?.html_content)
    console.log("[Sync Fields] Template data - html_content length:", templateData?.html_content?.length || 0)

    if (!templateData) {
      console.error("[Sync Fields] ERROR: Template data is null")
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    if (!templateData.html_content || templateData.html_content.trim() === "") {
      console.error("[Sync Fields] ERROR: Template has no HTML content")
      console.error("[Sync Fields] html_content value:", JSON.stringify(templateData.html_content))
      return NextResponse.json(
        {
          error: "Template has no HTML content",
          templateName: templateData.name,
          suggestion: "Please add HTML content with placeholders (e.g., {{field_id}}) to the template first",
        },
        { status: 400 }
      )
    }
    
    console.log("[Sync Fields] ✓ Template HTML content found")

    // Extract field IDs from HTML
    console.log("[Sync Fields] Extracting field IDs from HTML...")
    console.log("[Sync Fields] HTML content (first 200 chars):", templateData.html_content.substring(0, 200))
    console.log("[Sync Fields] HTML content (last 200 chars):", templateData.html_content.substring(Math.max(0, templateData.html_content.length - 200)))
    
    const extractedIds = extractFieldIds(templateData.html_content)
    
    // Debug logging
    console.log("[Sync Fields] ===== EXTRACTION RESULTS =====")
    console.log("[Sync Fields] HTML content length:", templateData.html_content?.length || 0)
    console.log("[Sync Fields] Extracted field IDs count:", extractedIds.length)
    console.log("[Sync Fields] Extracted field IDs:", extractedIds)
    console.log("[Sync Fields] HTML preview (first 500 chars):", templateData.html_content?.substring(0, 500))
    
    // Check for placeholder patterns manually - more thorough search
    const placeholderMatches = templateData.html_content.match(/{{[^}]+}}/g)
    console.log("[Sync Fields] Manual placeholder search (raw):", placeholderMatches)
    console.log("[Sync Fields] Manual placeholder count:", placeholderMatches?.length || 0)
    
    // Also search for any double curly braces pattern (even if invalid)
    const allCurlyBraces = templateData.html_content.match(/{{.*?}}/g)
    console.log("[Sync Fields] All {{...}} patterns found:", allCurlyBraces)
    console.log("[Sync Fields] All {{...}} patterns count:", allCurlyBraces?.length || 0)
    
    // Search for potential placeholders that might not match the regex
    const potentialPlaceholders: string[] = []
    const lines = templateData.html_content.split('\n')
    lines.forEach((line: string, index: number) => {
      if (line.includes('{{') && line.includes('}}')) {
        const matches = line.match(/{{[^}]*}}/g)
        if (matches) {
          matches.forEach((match: string) => {
            if (!potentialPlaceholders.includes(match)) {
              potentialPlaceholders.push(match)
              console.log(`[Sync Fields] Found placeholder on line ${index + 1}:`, match, "| Line:", line.trim().substring(0, 100))
            }
          })
        }
      }
    })
    console.log("[Sync Fields] All potential placeholders found:", potentialPlaceholders)
    
    if (extractedIds.length === 0 && placeholderMatches && placeholderMatches.length > 0) {
      console.warn("[Sync Fields] WARNING: Found placeholders but extraction returned 0!")
      console.warn("[Sync Fields] Placeholder matches:", placeholderMatches)
    }
    
    if (extractedIds.length !== (placeholderMatches?.length || 0)) {
      console.warn("[Sync Fields] WARNING: Mismatch between extracted count and manual search!")
      console.warn("[Sync Fields] Extracted:", extractedIds.length, "Manual search:", placeholderMatches?.length || 0)
    }

    // Get existing fields - IMPORTANT: Only fields for THIS template
    console.log("[Sync Fields] Fetching existing fields from database...")
    console.log("[Sync Fields] Filtering by template_id:", id, "(fields are template-specific)")
    const { data: existingFields, error: fieldsError } = await supabase
      .from("template_fields")
      .select("id, field_id, template_id")
      .eq("template_id", id)

    if (fieldsError) {
      console.error("[Sync Fields] ERROR: Failed to fetch existing fields")
      console.error("[Sync Fields] Error code:", fieldsError.code)
      console.error("[Sync Fields] Error message:", fieldsError.message)
      console.error("[Sync Fields] Error details:", fieldsError.details)
      // If table doesn't exist yet, that's okay - just continue with empty array
      if (fieldsError.code === "42P01") {
        console.warn("[Sync Fields] WARNING: template_fields table doesn't exist yet - run script 010")
        console.log("[Sync Fields] Continuing with empty existing fields array")
      } else {
        return NextResponse.json({ error: fieldsError.message }, { status: 500 })
      }
    }
    
    console.log("[Sync Fields] Existing fields count for this template:", existingFields?.length || 0)
    console.log("[Sync Fields] Existing fields (template-specific):", existingFields?.map(f => `${f.field_id} (template: ${f.template_id})`) || [])
    
    // Verify all fields belong to this template
    const wrongTemplateFields = existingFields?.filter(f => f.template_id !== id) || []
    if (wrongTemplateFields.length > 0) {
      console.error("[Sync Fields] ERROR: Found fields from different template!", wrongTemplateFields)
    }

    // Sync fields
    console.log("[Sync Fields] Syncing fields (comparing existing vs extracted)...")
    const { toCreate, toRemove } = syncFields(existingFields || [], extractedIds)
    
    console.log("[Sync Fields] ===== SYNC RESULTS =====")
    console.log("[Sync Fields] Fields to create count:", toCreate.length)
    console.log("[Sync Fields] Fields to create:", toCreate)
    console.log("[Sync Fields] Fields to remove count:", toRemove.length)
    console.log("[Sync Fields] Fields to remove:", toRemove)

    // Remove fields that no longer exist in template
    if (toRemove.length > 0) {
      const { error: deleteError } = await supabase.from("template_fields").delete().in("id", toRemove)
      if (deleteError) {
        console.error("Error deleting fields:", deleteError)
      }
    }

    // Create new fields with default metadata
    // IMPORTANT: Each field is tied to this specific template_id
    if (toCreate.length > 0) {
      console.log("[Sync Fields] Creating new fields for template_id:", id)
      const newFields = toCreate.map((fieldId) => {
        const fieldDef = getDefaultFieldDef(fieldId)
        console.log("[Sync Fields] Creating field:", fieldId, "for template:", id, "with def:", fieldDef)
        return {
          template_id: id, // CRITICAL: Field is scoped to this template only
          ...fieldDef,
          order_index: 0, // Will be updated by admin
        }
      })

      console.log("[Sync Fields] Inserting fields into database:", newFields.length, "fields")
      const { data: insertedFields, error: insertError } = await supabase
        .from("template_fields")
        .insert(newFields)
        .select()
      
      if (insertError) {
        console.error("[Sync Fields] ERROR: Failed to insert fields")
        console.error("[Sync Fields] Error code:", insertError.code)
        console.error("[Sync Fields] Error message:", insertError.message)
        console.error("[Sync Fields] Error details:", insertError.details)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
      
      console.log("[Sync Fields] ✓ Successfully created", insertedFields?.length || 0, "fields")
    } else {
      console.log("[Sync Fields] No new fields to create")
    }

    // Increment template version if fields changed
    // Only update version if the column exists (script 010 has been run)
    if (toCreate.length > 0 || toRemove.length > 0) {
      const updateData: any = { updated_at: new Date().toISOString() }
      
      // Try to get current version, but don't fail if column doesn't exist
      try {
        const { data: currentTemplate } = await supabase
          .from("templates")
          .select("version")
          .eq("id", id)
          .single()
        
        if (currentTemplate?.version !== undefined) {
          updateData.version = (currentTemplate.version || 1) + 1
        }
      } catch (e) {
        // Version column doesn't exist yet, skip version update
        console.log("[Sync Fields] Version column not available, skipping version increment")
      }
      
      await supabase.from("templates").update(updateData).eq("id", id)
    }

    // Return updated fields - ONLY for this template
    console.log("[Sync Fields] Fetching updated fields list for template_id:", id)
    const { data: updatedFields, error: fetchError } = await supabase
      .from("template_fields")
      .select("*")
      .eq("template_id", id) // CRITICAL: Only fields for this specific template
      .order("order_index", { ascending: true })

    if (fetchError) {
      console.error("[Sync Fields] ERROR: Failed to fetch updated fields")
      console.error("[Sync Fields] Error:", fetchError.message)
    } else {
      console.log("[Sync Fields] ✓ Final fields count:", updatedFields?.length || 0)
    }

    const response = {
      success: true,
      created: toCreate.length,
      removed: toRemove.length,
      extractedIds: extractedIds, // Debug: show what was extracted
      fields: updatedFields || [],
      debug: {
        htmlLength: templateData.html_content?.length || 0,
        extractedCount: extractedIds.length,
        existingCount: existingFields?.length || 0,
        htmlPreview: templateData.html_content?.substring(0, 200),
      },
    }
    
    console.log("[Sync Fields] ===== SYNC COMPLETE =====")
    console.log("[Sync Fields] Response:", JSON.stringify(response, null, 2))
    
    return NextResponse.json(response)
  } catch (error) {
    console.error("[Sync Fields] ===== FATAL ERROR =====")
    console.error("[Sync Fields] Error type:", error instanceof Error ? error.constructor.name : typeof error)
    console.error("[Sync Fields] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[Sync Fields] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

