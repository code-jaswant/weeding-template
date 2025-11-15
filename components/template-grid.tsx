"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { TemplateCard } from "./template-card"

export function TemplateGrid() {
  const [templates, setTemplates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("templates")
      .select("*")
      .eq("active", true)
      .order("featured", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setError(error.message)
        } else {
          setTemplates(data || [])
        }
        setIsLoading(false)
      })
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-muted rounded-lg h-64 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-destructive">Error loading templates: {error}</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => (
        <TemplateCard key={template.id} template={template} />
      ))}
    </div>
  )
}
