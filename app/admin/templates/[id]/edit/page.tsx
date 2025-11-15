import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { TemplateEditor } from "@/components/admin/template-editor"

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

  if (!profile?.is_admin) {
    redirect("/")
  }

  // Fetch template
  const { data: template } = await supabase.from("templates").select("*").eq("id", id).single()

  if (!template) {
    redirect("/admin")
  }

  // Fetch fields
  const { data: fields } = await supabase
    .from("template_fields")
    .select("*")
    .eq("template_id", id)
    .order("order_index", { ascending: true })

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <TemplateEditor template={template} initialFields={fields || []} />
    </main>
  )
}

