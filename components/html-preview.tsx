"use client"

import { Card } from "@/components/ui/card"

interface HtmlPreviewProps {
  htmlContent?: string
  isFullPage?: boolean
}

export function HtmlPreview({ htmlContent, isFullPage = false }: HtmlPreviewProps) {
  if (!htmlContent) {
    return (
      <Card className="p-6 bg-muted text-muted-foreground text-center">No preview available for this template</Card>
    )
  }

  return (
    <Card className="overflow-hidden bg-white dark:bg-slate-950">
      <iframe
        srcDoc={htmlContent}
        className={`w-full border-none ${isFullPage ? "h-screen" : "h-96"}`}
        title="Template Preview"
        sandbox="allow-same-origin"
      />
    </Card>
  )
}
