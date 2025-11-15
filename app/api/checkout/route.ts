import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Razorpay from "razorpay"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { templateId, userId, amount, email } = await request.json()

    console.log("[v0] Checkout request received:", { templateId, userId, amount, email })

    if (!templateId || !userId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    console.log("[v0] Environment variables check:", {
      hasKeyId: !!keyId,
      hasKeySecret: !!keySecret,
      keyIdPrefix: keyId ? keyId.substring(0, 5) : "missing",
    })

    if (!keyId || !keySecret) {
      console.error("[v0] Razorpay credentials missing!")
      return NextResponse.json(
        {
          error: "Payment gateway not configured",
          message: "Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET",
        },
        { status: 500 },
      )
    }

    const supabase = await createClient()

    // Get template details
    const { data: template, error: templateError } = await supabase
      .from("templates")
      .select("*")
      .eq("id", templateId)
      .single()

    if (templateError || !template) {
      console.error("[v0] Template fetch error:", templateError)
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    console.log("[v0] Creating Razorpay order for template:", template.name)

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })

    try {
      // Generate a unique receipt ID that's <= 40 characters (Razorpay requirement)
      // Format: ord_<short_hash>_<timestamp>
      const timestamp = Date.now()
      const receiptData = `${templateId}_${userId}_${timestamp}`
      const receiptHash = crypto.createHash("sha256").update(receiptData).digest("hex").substring(0, 24)
      const receipt = `ord_${receiptHash}_${timestamp.toString().slice(-6)}`
      
      // Ensure receipt is exactly 40 characters or less
      const finalReceipt = receipt.length > 40 ? receipt.substring(0, 40) : receipt

      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // Convert to paise
        currency: "INR",
        receipt: finalReceipt,
        notes: {
          templateId,
          userId,
          templateName: template.name,
        },
      })

      console.log("[v0] Order created successfully:", order.id)
      return NextResponse.json({ orderId: order.id, keyId })
    } catch (razorpayError) {
      console.error("[v0] Razorpay order creation failed", razorpayError)
      throw razorpayError
    }
  } catch (error) {
    console.error("[v0] Checkout error:", error)
    let errorMessage = "Checkout failed"
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      {
        error: "Checkout failed",
        message: errorMessage,
      },
      { status: 500 },
    )
  }
}
