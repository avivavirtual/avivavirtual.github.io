"use client"

import { UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

import { saveDemoUser } from "@/lib/demo-auth"

export default function RegisterPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!firstName.trim() || !businessName.trim() || !email.trim() || !password.trim()) {
      setError("First name, business name, email, and password are required.")
      return
    }
    saveDemoUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      businessName: businessName.trim(),
      email,
      password,
      createdAt: new Date().toISOString()
    })
    router.push("/dashboard")
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <form className="panel w-full max-w-lg p-6" onSubmit={submit}>
        <h1 className="font-heading text-2xl font-semibold">Register</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <input className="focus-ring rounded border border-slate-300 px-3 py-2" placeholder="First name" value={firstName} onChange={event => setFirstName(event.target.value)} />
          <input className="focus-ring rounded border border-slate-300 px-3 py-2" placeholder="Last name" value={lastName} onChange={event => setLastName(event.target.value)} />
          <input className="focus-ring rounded border border-slate-300 px-3 py-2 sm:col-span-2" placeholder="Business name" value={businessName} onChange={event => setBusinessName(event.target.value)} />
          <input className="focus-ring rounded border border-slate-300 px-3 py-2 sm:col-span-2" placeholder="Email" type="email" value={email} onChange={event => setEmail(event.target.value)} />
          <input className="focus-ring rounded border border-slate-300 px-3 py-2 sm:col-span-2" placeholder="Password" type="password" value={password} onChange={event => setPassword(event.target.value)} />
        </div>
        {error ? <p className="mt-4 rounded bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        <button className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded bg-sky-600 px-4 py-2 text-white">
          <UserPlus size={16} />
          Create account
        </button>
      </form>
    </main>
  )
}
