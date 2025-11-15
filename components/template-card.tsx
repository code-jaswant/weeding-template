"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export function TemplateCard({ template }: { template: any }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="w-full h-48 bg-muted overflow-hidden">
        {template.thumbnail_url && (
          <img
            src={template.thumbnail_url || "/placeholder.svg"}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <CardHeader>
        <CardTitle className="line-clamp-2">{template.name}</CardTitle>
        <CardDescription>{template.category}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <span className="text-2xl font-bold text-primary">${template.price}</span>
          <div className="flex gap-2">
            <Link href={`/template/${template.id}`}>
              <Button variant="outline" size="sm">
                View
              </Button>
            </Link>
            <Link href={`/template/${template.id}/checkout`}>
              <Button size="sm">Buy</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
