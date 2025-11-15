import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Razorpay from "razorpay"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, templateId, userId } = await request.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !templateId || !userId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error("[v0] RAZORPAY_KEY_SECRET not configured")
      return NextResponse.json({ success: false, error: "Payment verification not configured" }, { status: 500 })
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body).digest("hex")

    if (expectedSignature !== razorpay_signature) {
      console.error("[v0] Signature mismatch - payment tampered")
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 })
    }

    if (!process.env.RAZORPAY_KEY_ID) {
      console.error("[v0] RAZORPAY_KEY_ID not configured")
      return NextResponse.json({ success: false, error: "Payment verification not configured" }, { status: 500 })
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    const supabase = await createClient()

    // Verify the authenticated user matches the userId in the request
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user || user.id !== userId) {
      console.error("[v0] Authentication error or user mismatch:", authError)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get payment details
    const payment = await razorpay.payments.fetch(razorpay_payment_id)

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        total_amount: payment.amount / 100,
        status: "completed",
        stripe_payment_id: razorpay_payment_id,
        stripe_invoice_id: razorpay_order_id,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error("[v0] Order creation error:", orderError)
      return NextResponse.json({ success: false, error: "Order creation failed" }, { status: 500 })
    }

    // Create order item
    const { data: template } = await supabase.from("templates").select("price").eq("id", templateId).single()

    if (!template) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 })
    }

    const { data: orderItem, error: itemError } = await supabase
      .from("order_items")
      .insert({
        order_id: order.id,
        template_id: templateId,
        price_at_purchase: template.price,
      })
      .select()
      .single()

    if (itemError) {
      console.error("[v0] Order item creation error:", itemError)
      return NextResponse.json({ success: false, error: "Order item creation failed" }, { status: 500 })
    }

    // Generate QR code data
    const qrData = JSON.stringify({
      orderId: order.id,
      templateId: templateId,
      userId: userId,
      purchaseDate: new Date().toISOString(),
    })

    const { error: qrError } = await supabase.from("qr_codes").insert({
      order_item_id: orderItem.id,
      qr_code_data: qrData,
    })

    if (qrError) {
      console.error("[v0] QR code creation error:", qrError)
    }

    console.log("[v0] Payment verified and order created successfully:", order.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Payment verification error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 })
  }
}
