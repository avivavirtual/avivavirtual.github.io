import { Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <form className="panel w-full max-w-md p-6">
        <h1 className="font-heading text-2xl font-semibold">Forgot password</h1>
        <input className="focus-ring mt-6 w-full rounded border border-slate-300 px-3 py-2" placeholder="Email" type="email" />
        <button className="focus-ring mt-4 inline-flex w-full items-center justify-center gap-2 rounded bg-sky-600 px-4 py-2 text-white">
          <Mail size={16} />
          Send reset link
        </button>
      </form>
    </main>
  )
}
