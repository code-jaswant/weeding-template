"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

export default function CallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code")

        if (!code) {
          setError("No authorization code provided")
          setIsProcessing(false)
          return
        }

        const supabase = createClient()

        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          throw exchangeError
        }

        router.push("/dashboard")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Confirmation failed")
        setIsProcessing(false)
      }
    }

    handleCallback()
  }, [searchParams, router])

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Confirming Email</CardTitle>
            <CardDescription>Please wait while we confirm your email address...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Spinner />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-destructive">Confirmation Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive mb-4">{error}</p>
            <button onClick={() => router.push("/auth/login")} className="text-primary underline">
              Return to login
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
