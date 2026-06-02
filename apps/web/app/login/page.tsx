"use client"

import { LogIn } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

import { findDemoUser, setCurrentDemoUser } from "@/lib/demo-auth"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const user = findDemoUser(email, password)
    if (!user) {
      setError("No matching demo account found. Register first, or check the email and password.")
      return
    }
    setCurrentDemoUser(user)
    router.push("/dashboard")
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <form className="panel w-full max-w-md p-6" onSubmit={submit}>
        <h1 className="font-heading text-2xl font-semibold">Login</h1>
        <div className="mt-6 grid gap-4">
          <input className="focus-ring rounded border border-slate-300 px-3 py-2" placeholder="Email" type="email" value={email} onChange={event => setEmail(event.target.value)} />
          <input className="focus-ring rounded border border-slate-300 px-3 py-2" placeholder="Password" type="password" value={password} onChange={event => setPassword(event.target.value)} />
          <button className="focus-ring inline-flex items-center justify-center gap-2 rounded bg-sky-600 px-4 py-2 text-white">
            <LogIn size={16} />
            Login
          </button>
        </div>
        {error ? <p className="mt-4 rounded bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        <div className="mt-4 flex justify-between text-sm text-slate-600">
          <Link href="/forgot-password">Forgot password</Link>
          <Link href="/register">Register</Link>
        </div>
      </form>
    </main>
  )
}
