import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*, templates(*))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        {!orders || orders.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">You haven&apos;t purchased any templates yet.</p>
              <Link href="/">
                <Button>Browse Templates</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order: any) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
                      <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm">
                      {order.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.order_items?.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center pb-2 border-b border-border last:border-0"
                      >
                        <div>
                          <p className="font-medium">{item.templates?.name}</p>
                          <p className="text-sm text-muted-foreground">${item.price_at_purchase.toFixed(2)}</p>
                        </div>
                        <Link href={`/dashboard/order/${order.id}/download`}>
                          <Button size="sm">Download</Button>
                        </Link>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-border">
                      <p className="text-lg font-bold">Total: ${order.total_amount.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
