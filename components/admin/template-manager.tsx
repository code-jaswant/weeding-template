"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AddTemplateDialog } from "./add-template-dialog"
import { Edit2, Trash2 } from "lucide-react"

interface Template {
  id: string
  name: string
  category: string
  price: number
  active: boolean
}

export function TemplateManager({ templates: initialTemplates }: { templates: Template[] }) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleTemplateAdded = () => {
    // Refresh templates by reloading the page
    setRefreshKey((prev) => prev + 1)
    window.location.reload()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return

    try {
      const response = await fetch(`/api/templates?id=${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete")
      setTemplates(templates.filter((t) => t.id !== id))
      window.location.reload()
    } catch (error) {
      alert("Error deleting template: " + (error as Error).message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <AddTemplateDialog onTemplateAdded={handleTemplateAdded} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{templates.length}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Category</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-center py-2">Status</th>
                  <th className="text-center py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3">{template.name}</td>
                    <td className="py-3">{template.category}</td>
                    <td className="py-3 text-right">₹{template.price.toFixed(2)}</td>
                    <td className="py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          template.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {template.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mr-2"
                        onClick={() => window.location.href = `/admin/templates/${template.id}/edit`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
