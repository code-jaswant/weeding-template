"use client"
import { useState } from "react"
import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/navbar"

export default function AdminSetupPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const supabase = createClient()

  const handleMakeAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setError("")

    try {
      const { data, error: supabaseError } = await supabase
        .from("profiles")
        .update({ is_admin: true })
        .eq("email", email.toLowerCase())
        .select()

      if (supabaseError) throw supabaseError

      if (!data || data.length === 0) {
        setError("User not found. Make sure they've signed up first.")
        return
      }

      setMessage(`Successfully made ${email} an admin!`)
      setEmail("")
    } catch (err: any) {
      setError(err.message || "Failed to update admin status")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Admin Setup</CardTitle>
            <CardDescription>Make a user an admin by entering their email address</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMakeAdmin} className="space-y-4">
              <Input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Processing..." : "Make Admin"}
              </Button>

              {message && <div className="p-3 bg-green-50 text-green-800 rounded-lg text-sm">{message}</div>}
              {error && <div className="p-3 bg-red-50 text-red-800 rounded-lg text-sm">{error}</div>}
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Quick Setup Instructions:</h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Sign up for an account if you haven't already</li>
            <li>Come back to this page and enter your email</li>
            <li>Click "Make Admin" to grant yourself admin privileges</li>
            <li>Go to /admin to access the admin dashboard</li>
          </ol>
        </div>
      </div>
    </main>
  )
}
