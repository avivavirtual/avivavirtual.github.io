import { ChatBubble } from "@/components/ui/ChatBubble"
import { AiConfidenceBar } from "@/components/ui/AiConfidenceBar"
import { CallTranscriptPanel } from "@/components/voip/CallTranscriptPanel"

export default function ConversationDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <section className="panel min-h-[640px] p-4">
        <h1 className="font-heading text-2xl font-semibold">AI conversation {params.id}</h1>
        <div className="mt-6 space-y-3">
          <ChatBubble sender="Customer" content="Can you explain my invoice and callback options?" />
          <ChatBubble sender="AI" content="Your billing cycle is monthly in Canadian dollars. I can create a support request for account-specific review." side="right" />
          <ChatBubble sender="Support" content="I reviewed the summary and added the callback options to the ticket." side="right" />
        </div>
      </section>
      <aside className="space-y-4">
        <div className="panel p-4">
          <h2 className="font-semibold">AI suggestion</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Confirm the billing-cycle policy, ask for the invoice number, and offer a callback window.</p>
          <div className="mt-4">
            <AiConfidenceBar value={0.81} />
          </div>
        </div>
        <CallTranscriptPanel callRecordId="demo-call" />
      </aside>
    </div>
  )
}
