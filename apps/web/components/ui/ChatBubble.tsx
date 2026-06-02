export function ChatBubble({ sender, content, side = "left" }: { sender: string; content: string; side?: "left" | "right" }) {
  const align = side === "right" ? "ml-auto bg-sky-600 text-white" : "mr-auto bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100"
  return (
    <div className={`max-w-[78%] rounded p-3 shadow-sm ${align}`}>
      <p className="mb-1 text-xs opacity-75">{sender}</p>
      <p className="text-sm leading-6">{content}</p>
    </div>
  )
}
