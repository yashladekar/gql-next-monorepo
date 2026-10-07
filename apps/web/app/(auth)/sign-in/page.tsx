"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Spinner } from "@workspace/ui/components/spinner"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

const DEMO_PASSWORD = "password1234"

const DEMO_USERS = [
  { label: "Alice", role: "Owner", email: "alice@acme.test" },
  { label: "Bob", role: "Admin", email: "bob@acme.test" },
  { label: "Charlie", role: "Project Editor", email: "charlie@acme.test" },
  { label: "David", role: "Project Viewer", email: "david@acme.test" },
  { label: "Eve", role: "Globex Owner", email: "eve@globex.test" },
]

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("alice@acme.test")
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function signIn(withEmail: string, withPassword: string) {
    setError(null)
    setPending(withEmail)
    const { error: signInError } = await authClient.signIn.email({
      email: withEmail,
      password: withPassword,
    })
    setPending(null)
    if (signInError) {
      setError(signInError.message ?? "Sign in failed")
      return
    }
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold">FGAC Reference</h1>
          <p className="text-sm text-muted-foreground">
            Fine-grained access control with OpenFGA. Sign in as different users to see the UI
            re-project itself.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Demo accounts</CardTitle>
            <CardDescription>One click signs in with a known password.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {DEMO_USERS.map((demo) => (
              <Button
                key={demo.email}
                variant="outline"
                className="justify-between"
                disabled={pending !== null}
                onClick={() => signIn(demo.email, DEMO_PASSWORD)}
              >
                <span className="flex items-center gap-2">
                  {pending === demo.email ? <Spinner className="size-3.5" /> : null}
                  <span className="font-medium">{demo.label}</span>
                </span>
                <span className="text-xs text-muted-foreground">{demo.role}</span>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sign in with credentials</CardTitle>
            <CardDescription>Any seeded account, password {DEMO_PASSWORD}.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                void signIn(email, password)
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" disabled={pending !== null}>
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
