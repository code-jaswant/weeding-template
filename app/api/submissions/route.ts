import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// POST - Create a new submission
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const body = await request.json()
    const { template_id, template_version, data } = body

    if (!template_id || !data) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get current user (optional - submissions can be anonymous)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Get template version if not provided
    let version = template_version
    if (!version) {
      const { data: template } = await supabase
        .from("templates")
        .select("version")
        .eq("id", template_id)
        .single()
      version = template?.version || 1
    }

    // Create submission
    const { data: submission, error } = await supabase
      .from("submissions")
      .insert({
        template_id,
        template_version: version,
        data,
        created_by: user?.id || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    console.error("Error creating submission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET - List submissions (for authenticated users or admins)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get("template_id")

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if admin
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

    let query = supabase.from("submissions").select("*")

    if (templateId) {
      query = query.eq("template_id", templateId)
    }

    // Non-admins can only see their own submissions
    if (!profile?.is_admin) {
      query = query.eq("created_by", user.id)
    }

    const { data: submissions, error } = await query.order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ submissions: submissions || [] })
  } catch (error) {
    console.error("Error fetching submissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

