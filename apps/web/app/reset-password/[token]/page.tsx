import { KeyRound } from "lucide-react"

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <form className="panel w-full max-w-md p-6">
        <h1 className="font-heading text-2xl font-semibold">Reset password</h1>
        <p className="mt-2 text-xs text-slate-500">Token ending {params.token.slice(-6)}</p>
        <input className="focus-ring mt-6 w-full rounded border border-slate-300 px-3 py-2" placeholder="New password" type="password" />
        <button className="focus-ring mt-4 inline-flex w-full items-center justify-center gap-2 rounded bg-sky-600 px-4 py-2 text-white">
          <KeyRound size={16} />
          Update password
        </button>
      </form>
    </main>
  )
}
