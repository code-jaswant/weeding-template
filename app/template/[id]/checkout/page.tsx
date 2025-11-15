"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.id as string

  const [template, setTemplate] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login")
        return
      }
      setUser(user)
    })

    // Get template details
    supabase
      .from("templates")
      .select("*")
      .eq("id", templateId)
      .single()
      .then(({ data }) => {
        setTemplate(data)
        setIsLoading(false)
      })

    // Load Razorpay script
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    document.head.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [templateId, router])

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!template || !user) return

    setIsProcessing(true)
    setCardError(null)

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          userId: user.id,
          amount: template.price,
          email: user.email,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create order")
      }

      const { orderId, keyId, error } = await response.json()
      if (error) throw new Error(error)

      if (!orderId || !keyId) {
        throw new Error("Invalid response from server")
      }

      const options = {
        key: keyId,
        amount: Math.round(template.price * 100),
        currency: "INR",
        name: "Wedding Template Marketplace",
        description: template.name,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                templateId: template.id,
                userId: user.id,
              }),
            })

            const verifyData = await verifyResponse.json()
            if (verifyData.success) {
              router.push("/dashboard?payment=success")
            } else {
              throw new Error("Payment verification failed")
            }
          } catch (error) {
            setCardError(error instanceof Error ? error.message : "Payment verification failed")
          }
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: "#ec4899",
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on("payment.failed", (response: any) => {
        setCardError(response.error.description)
      })
      rzp.open()
    } catch (error) {
      setCardError(error instanceof Error ? error.message : "Payment failed")
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-muted rounded-lg h-96 animate-pulse" />
        </div>
      </main>
    )
  }

  if (!template) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <p className="text-destructive">Template not found</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Complete Your Purchase</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {template.thumbnail_url && (
                <img
                  src={template.thumbnail_url || "/placeholder.svg"}
                  alt={template.name}
                  className="w-full rounded-lg"
                />
              )}
              <div className="pt-4 border-t border-border">
                <p className="text-lg font-semibold">₹{template.price}</p>
                <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCheckout} className="space-y-6">
                <div className="space-y-4 pb-4 border-b border-border">
                  <div className="flex justify-between">
                    <span>Template</span>
                    <span>₹{template.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>₹{template.price.toFixed(2)}</span>
                  </div>
                </div>

                {cardError && <p className="text-sm text-destructive">{cardError}</p>}

                <Button type="submit" disabled={isProcessing} className="w-full" size="lg">
                  {isProcessing ? "Processing..." : "Proceed to Payment"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">Payment processed securely by Razorpay</p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
