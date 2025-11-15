"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user)

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()
        setIsAdmin(profile?.is_admin || false)
      }

      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription?.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <nav className="border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-primary">
          Wedding Templates
        </Link>
        <div className="flex items-center gap-4">
          {!isLoading && (
            <>
              {user ? (
                <>
                  <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                    My Orders
                  </Link>
                  {isAdmin && (
                    <>
                      <Link href="/admin" className="text-sm font-medium text-primary hover:text-primary/80">
                        Admin
                      </Link>
                      <Link href="/admin-setup" className="text-sm text-muted-foreground hover:text-foreground">
                        Admin Setup
                      </Link>
                    </>
                  )}
                  {!isAdmin && (
                    <Link href="/admin-setup" className="text-sm text-muted-foreground hover:text-foreground">
                      Become Admin
                    </Link>
                  )}
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground">
                    Sign in
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm">Sign up</Button>
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
