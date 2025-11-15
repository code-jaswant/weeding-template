"use server"

export async function getRazorpayKey() {
  const keyId = process.env.RAZORPAY_KEY_ID
  if (!keyId) {
    throw new Error("Razorpay Key ID is not configured")
  }
  return keyId
}
