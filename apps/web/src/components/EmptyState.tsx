import { Inbox } from 'lucide-react'

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state">
      <Inbox size={34} />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}

