"use client"

import { RotateCcw } from "lucide-react"
import type { ErrorInfo, ReactNode } from "react"
import { Component } from "react"

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="panel p-6">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <button className="focus-ring mt-4 inline-flex items-center gap-2 rounded bg-sky-600 px-3 py-2 text-sm text-white" onClick={() => this.setState({ hasError: false })}>
          <RotateCcw size={16} />
          Retry
        </button>
      </div>
    )
  }
}
