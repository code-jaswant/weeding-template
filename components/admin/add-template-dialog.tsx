"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus } from "lucide-react"

interface AddTemplateDialogProps {
  onTemplateAdded: () => void
}

export function AddTemplateDialog({ onTemplateAdded }: AddTemplateDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showHtmlEditor, setShowHtmlEditor] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "wedding",
    price: "",
    preview_url: "",
    demo_url: "",
    thumbnail_url: "",
    html_content: "",
    featured: false,
    active: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to create template")
      }

      setFormData({
        name: "",
        description: "",
        category: "wedding",
        price: "",
        preview_url: "",
        demo_url: "",
        thumbnail_url: "",
        html_content: "",
        featured: false,
        active: true,
      })
      setShowHtmlEditor(false)
      setOpen(false)
      onTemplateAdded()
    } catch (error) {
      alert("Error creating template: " + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="mb-4">
        <Plus className="w-4 h-4 mr-2" />
        Add Template
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Template</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Classic Wedding"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Template description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wedding">Wedding</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="invitation">Invitation</SelectItem>
                    <SelectItem value="rsvp">RSVP</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  required
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="99.99"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
              <Input
                id="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                placeholder="https://example.com/thumbnail.jpg"
              />
            </div>

            <div>
              <Label htmlFor="preview_url">Preview URL</Label>
              <Input
                id="preview_url"
                value={formData.preview_url}
                onChange={(e) => setFormData({ ...formData, preview_url: e.target.value })}
                placeholder="https://example.com/preview.jpg"
              />
            </div>

            <div>
              <Label htmlFor="demo_url">Demo URL</Label>
              <Input
                id="demo_url"
                value={formData.demo_url}
                onChange={(e) => setFormData({ ...formData, demo_url: e.target.value })}
                placeholder="https://example.com/demo"
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  id="use_html"
                  checked={showHtmlEditor}
                  onCheckedChange={(checked) => setShowHtmlEditor(checked as boolean)}
                />
                <Label htmlFor="use_html" className="cursor-pointer font-medium">
                  Add HTML Preview Template
                </Label>
              </div>

              {showHtmlEditor && (
                <div>
                  <Label htmlFor="html_content">HTML Code</Label>
                  <Textarea
                    id="html_content"
                    value={formData.html_content}
                    onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                    placeholder="<html><head><title>Wedding Template</title></head><body><h1>Welcome</h1></body></html>"
                    className="font-mono text-xs h-48"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste your HTML code here. It will be displayed in an iframe on the template details page.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked as boolean })}
                />
                <Label htmlFor="featured" className="cursor-pointer">
                  Featured
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked as boolean })}
                />
                <Label htmlFor="active" className="cursor-pointer">
                  Active
                </Label>
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Template"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
