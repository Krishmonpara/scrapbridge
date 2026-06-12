'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { MessageSquare, Send } from 'lucide-react'

interface ThreadCompany {
  id: string
  name: string
  slug: string
}

interface Thread {
  inquiry: {
    id: string
    message: string
    status: string
    createdAt: string
    fromCompany: ThreadCompany
    toCompany: ThreadCompany
    listing: { id: string; title: string; photos: string[] } | null
  }
  lastMessage: { body: string; createdAt: string; senderCompanyId: string } | null
  unread: number
}

interface Message {
  id: string
  senderCompanyId: string
  body: string
  createdAt: string
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export function MessagesClient({ companyId }: { companyId: string }) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const loadThreads = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?companyId=${companyId}`)
      if (res.ok) {
        const data = await res.json()
        setThreads(data.threads)
      }
    } finally {
      setLoading(false)
    }
  }, [companyId])

  const loadMessages = useCallback(async (inquiryId: string) => {
    const res = await fetch(`/api/messages?inquiryId=${inquiryId}`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data.messages)
    }
    // mark read + clear local unread count
    fetch('/api/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inquiryId, readerCompanyId: companyId }),
    })
    setThreads((prev) =>
      prev.map((t) => (t.inquiry.id === inquiryId ? { ...t, unread: 0 } : t))
    )
  }, [companyId])

  useEffect(() => { loadThreads() }, [loadThreads])

  // light polling keeps the thread fresh without websockets
  useEffect(() => {
    if (!activeId) return
    const interval = setInterval(() => loadMessages(activeId), 15000)
    return () => clearInterval(interval)
  }, [activeId, loadMessages])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  const openThread = (id: string) => {
    setActiveId(id)
    setMessages([])
    loadMessages(id)
  }

  const send = async () => {
    if (!draft.trim() || !activeId || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiryId: activeId, senderCompanyId: companyId, body: draft }),
      })
      if (res.ok) {
        const msg = await res.json()
        setMessages((prev) => [...prev, msg])
        setDraft('')
        loadThreads()
      }
    } finally {
      setSending(false)
    }
  }

  const active = threads.find((t) => t.inquiry.id === activeId)

  if (!loading && threads.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        size="md"
        title="No conversations yet"
        description="When you send or receive an inquiry, the conversation thread will appear here."
      />
    )
  }

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-[320px_1fr] rounded overflow-hidden"
      style={{ border: '1px solid var(--border)', height: 'calc(100vh - 220px)', minHeight: 420 }}
    >
      {/* Thread list */}
      <div
        className={`overflow-y-auto ${activeId ? 'hidden md:block' : ''}`}
        style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}
      >
        {threads.map((t) => {
          const other = t.inquiry.fromCompany.id === companyId ? t.inquiry.toCompany : t.inquiry.fromCompany
          const preview = t.lastMessage?.body ?? t.inquiry.message
          return (
            <button
              key={t.inquiry.id}
              onClick={() => openThread(t.inquiry.id)}
              className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
              style={{
                borderBottom: '1px solid var(--border)',
                background: t.inquiry.id === activeId ? 'var(--bg-tertiary)' : undefined,
              }}
            >
              <div
                className="w-9 h-9 rounded-sm flex items-center justify-center font-bold text-sm shrink-0"
                style={{ background: 'var(--bg-primary)', color: 'var(--accent)' }}
              >
                {other.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{other.name}</p>
                  <span className="text-[10px] text-[var(--text-tertiary)] shrink-0">
                    {timeAgo(t.lastMessage?.createdAt ?? t.inquiry.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-tertiary)] truncate mb-0.5">
                  {t.inquiry.listing?.title ?? 'Listing removed'}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-[var(--text-secondary)] truncate flex-1">{preview}</p>
                  {t.unread > 0 && (
                    <span
                      className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] flex items-center justify-center font-semibold"
                      style={{ background: 'var(--foreground)', color: 'var(--background)' }}
                    >
                      {t.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Conversation */}
      <div className={`flex flex-col min-w-0 ${activeId ? '' : 'hidden md:flex'}`} style={{ background: 'var(--bg-primary)' }}>
        {!active ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-[var(--text-tertiary)]">Select a conversation</p>
          </div>
        ) : (
          <>
            <div
              className="flex items-center gap-3 px-4 py-3 shrink-0"
              style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
            >
              <button
                onClick={() => setActiveId(null)}
                className="md:hidden text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                ←
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {(active.inquiry.fromCompany.id === companyId ? active.inquiry.toCompany : active.inquiry.fromCompany).name}
                </p>
                {active.inquiry.listing && (
                  <Link
                    href={`/listing/${active.inquiry.listing.id}`}
                    className="text-xs text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors truncate block"
                  >
                    Re: {active.inquiry.listing.title}
                  </Link>
                )}
              </div>
              <Badge variant={active.inquiry.status === 'RESPONDED' ? 'success' : 'amber'}>
                {active.inquiry.status}
              </Badge>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
              {/* original inquiry as first bubble */}
              <MessageBubble
                mine={active.inquiry.fromCompany.id === companyId}
                body={active.inquiry.message}
                time={active.inquiry.createdAt}
              />
              {messages.map((m) => (
                <MessageBubble key={m.id} mine={m.senderCompanyId === companyId} body={m.body} time={m.createdAt} />
              ))}
            </div>

            <div className="flex items-end gap-2 px-4 py-3 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                rows={1}
                placeholder="Write a message… (Enter to send)"
                className="flex-1 resize-none text-sm px-3 py-2 rounded bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--foreground)]/40"
                style={{ border: '1px solid var(--border)' }}
              />
              <Button size="md" onClick={send} loading={sending} disabled={!draft.trim()}>
                <Send size={14} />
                Send
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function MessageBubble({ mine, body, time }: { mine: boolean; body: string; time: string }) {
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[75%] px-3 py-2 rounded text-sm leading-relaxed"
        style={
          mine
            ? { background: 'var(--foreground)', color: 'var(--background)' }
            : { background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
        }
      >
        <p className="whitespace-pre-wrap break-words">{body}</p>
        <p className="text-[10px] mt-1 opacity-60 text-right">{timeAgo(time)}</p>
      </div>
    </div>
  )
}
