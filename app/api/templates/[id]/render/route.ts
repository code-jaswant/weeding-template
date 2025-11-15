import { createClient } from "@/lib/supabase/server"
import { renderHtml } from "@/lib/template-utils"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const body = await request.json()
    const { data: formData } = body

    if (!formData || typeof formData !== "object") {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
    }

    // Get template HTML
    // Note: version column might not exist if script 010 hasn't been run yet
    const { data: template, error: templateError } = await supabase
      .from("templates")
      .select("html_content")
      .eq("id", id)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    if (!template.html_content) {
      return NextResponse.json({ error: "Template has no HTML content" }, { status: 400 })
    }

    // Try to get version if column exists
    let version = 1
    try {
      const { data: versionData } = await supabase
        .from("templates")
        .select("version")
        .eq("id", id)
        .single()
      if (versionData?.version !== undefined) {
        version = versionData.version || 1
      }
    } catch (e) {
      // Version column doesn't exist, use default
    }

    // Render HTML with form data
    const renderedHtml = renderHtml(template.html_content, formData)

    return NextResponse.json({
      html: renderedHtml,
      version: version,
    })
  } catch (error) {
    console.error("Error rendering template:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

