import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { AdminDashboard } from "@/components/admin-dashboard"

export default async function AdminPage() {
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

  const { data: templates } = await supabase.from("templates").select("*").order("created_at", { ascending: false })

  // Fetch orders with proper joins
  // Note: Supabase auto-detects relationships based on foreign keys
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(
      `
      *,
      profiles!user_id(email),
      order_items(
        *,
        templates(*)
      )
    `
    )
    .order("created_at", { ascending: false })

  if (ordersError) {
    console.error("[Admin] Error fetching orders:", ordersError)
    console.error("[Admin] Error details:", JSON.stringify(ordersError, null, 2))
  } else {
    console.log("[Admin] Orders fetched successfully:", orders?.length || 0, "orders")
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <AdminDashboard templates={templates || []} orders={orders || []} />
    </main>
  )
}
