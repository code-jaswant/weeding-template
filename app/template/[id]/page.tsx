import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { ArrowLeft } from "lucide-react"
import { TemplateDetailPreview } from "@/components/template-detail-preview"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id } = await params

  const { data: template, error } = await supabase.from("templates").select("*").eq("id", id).single()

  if (error || !template) {
    notFound()
  }

  // Fetch fields for this template
  const { data: fields } = await supabase
    .from("template_fields")
    .select("*")
    .eq("template_id", id)
    .order("order_index", { ascending: true })

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="relative min-h-screen">
        {/* Back button */}
        <div className="max-w-7xl mx-auto w-full px-4 py-4">
          <Link href="/" className="text-primary hover:underline inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to templates
          </Link>
        </div>

        {/* Template preview with live customization */}
        <div className="max-w-7xl mx-auto w-full px-4 pb-32">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">{template.name}</h1>
            {template.description && (
              <p className="text-muted-foreground">{template.description}</p>
            )}
          </div>

          <TemplateDetailPreview template={template} fields={fields || []} />
        </div>
      </div>
    </main>
  )
}
