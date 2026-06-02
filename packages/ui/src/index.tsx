import type { ButtonHTMLAttributes, ReactNode } from "react"

export function Button({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button className={`rounded bg-sky-600 px-3 py-2 text-sm text-white ${className}`} {...props}>
      {children}
    </button>
  )
}

export function Surface({ children }: { children: ReactNode }) {
  return <div className="rounded border border-slate-200 bg-white p-4">{children}</div>
}
