import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { TemplateForm } from "@/components/template-form"

export default async function TemplateFillPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch template (must be active)
  const { data: template } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .eq("active", true)
    .single()

  if (!template) {
    redirect("/")
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
      <TemplateForm template={template} fields={fields || []} />
    </main>
  )
}

