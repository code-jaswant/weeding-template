import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>Confirm your account to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We&apos;ve sent a confirmation link to your email. Please check your inbox and click the link to verify
              your account.
            </p>
            <p className="text-sm text-muted-foreground">
              Once confirmed, you can sign in and start browsing wedding templates.
            </p>
            <Link href="/auth/login" className="text-primary underline underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
