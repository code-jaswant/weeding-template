import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function OrderDownloadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id: orderId } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*, templates(*, qr_codes(*)))")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single()

  if (!order) {
    redirect("/dashboard")
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Download Template</h1>

        <div className="space-y-6">
          {order.order_items?.map((item: any) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle>{item.templates?.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{item.templates?.description}</p>

                {item.templates?.qr_codes?.[0] && (
                  <div className="space-y-2">
                    <p className="font-semibold text-sm">QR Code</p>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-xs text-muted-foreground font-mono">
                        {item.templates.qr_codes[0].qr_code_data}
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-border space-y-2">
                  <Button className="w-full" asChild>
                    <a href={item.templates?.demo_url} target="_blank" rel="noopener noreferrer">
                      View Template Demo
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent" asChild>
                    <a href="#">Download PDF</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
