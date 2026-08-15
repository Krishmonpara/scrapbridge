'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, AlertTriangle, Tag } from 'lucide-react'
import type { PositionView } from '@/lib/position/queries'
import type { MarketSymbol, QuoteUnit } from '@/lib/market/types'
import { formatQuote } from '@/lib/market/types'

interface Choice {
  symbol: MarketSymbol
  label: string
  unit: QuoteUnit
}

const UNITS = ['TONS', 'LBS', 'KG', 'PIECES', 'LOT'] as const

const usd = (v: number) =>
  v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const card = { background: 'var(--bg-secondary)', border: '1px solid var(--border)' }
const mono = { fontFamily: 'var(--font-mono)' }
const input = {
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
}

export function PositionClient({ initial, choices }: { initial: PositionView; choices: Choice[] }) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { lots, totals } = initial
  const hasPnl = totals.costTotal > 0

  async function addLot(form: FormData) {
    setBusy(true)
    setError(null)
    const costRaw = String(form.get('costBasis') ?? '').trim()
    const payload = {
      symbol: String(form.get('symbol')),
      label: String(form.get('label') ?? '').trim() || null,
      quantity: Number(form.get('quantity')),
      unit: String(form.get('unit')),
      costBasis: costRaw === '' ? null : Number(costRaw),
    }
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.issues?.[0] ?? body.error ?? 'Could not save this lot.')
        return
      }
      setAdding(false)
      router.refresh()
    } catch {
      setError('Network error — the lot was not saved.')
    } finally {
      setBusy(false)
    }
  }

  async function removeLot(id: string) {
    setBusy(true)
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' })
      if (res.ok) router.refresh()
      else setError('Could not remove that lot.')
    } catch {
      setError('Network error — the lot was not removed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ---- totals ---- */}
      <div
        className="grid gap-px sm:grid-cols-2 lg:grid-cols-4"
        style={{ background: 'var(--border)', border: '1px solid var(--border)' }}
      >
        <Tile
          label="Market value"
          value={usd(totals.marketValue)}
          note={`${totals.lotCount} lot${totals.lotCount === 1 ? '' : 's'} tracked`}
        />
        <Tile
          label="Unrealised P&L"
          value={
            hasPnl
              ? `${totals.unrealizedPnl >= 0 ? '▲ +' : '▼ −'}${usd(Math.abs(totals.unrealizedPnl))}`
              : '—'
          }
          note={hasPnl ? 'Against the cost you entered.' : 'Add a cost basis to see P&L.'}
          tone={hasPnl ? (totals.unrealizedPnl >= 0 ? 'up' : 'down') : 'plain'}
        />
        <Tile
          label="Return"
          value={
            totals.unrealizedPct !== null
              ? `${totals.unrealizedPct >= 0 ? '+' : '−'}${Math.abs(totals.unrealizedPct).toFixed(1)}%`
              : '—'
          }
          note={totals.unrealizedPct !== null ? 'On lots with a cost basis.' : 'Needs a cost basis.'}
          tone={totals.unrealizedPct === null ? 'plain' : totals.unrealizedPct >= 0 ? 'up' : 'down'}
        />
        <Tile
          label="Not valued"
          value={String(totals.unvaluedCount)}
          note={totals.unvaluedCount > 0 ? 'Excluded from the total above.' : 'Every lot has a price.'}
        />
      </div>

      {(totals.unvaluedCount > 0 || totals.staleCount > 0) && (
        <div
          className="flex items-start gap-2.5 p-3 text-[13px]"
          style={{ ...card, color: 'var(--text-secondary)' }}
        >
          <AlertTriangle size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--copper)' }} />
          <span>
            {totals.unvaluedCount > 0 && (
              <>
                {totals.unvaluedCount} lot{totals.unvaluedCount === 1 ? '' : 's'} could not be valued
                and {totals.unvaluedCount === 1 ? 'is' : 'are'} left out of the total above.{' '}
              </>
            )}
            {totals.staleCount > 0 && (
              <>
                {totals.staleCount} lot{totals.staleCount === 1 ? '' : 's'} priced off a stale quote.
              </>
            )}
          </span>
        </div>
      )}

      {/* ---- add ---- */}
      <div>
        {!adding ? (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            style={{ background: 'var(--foreground)', color: 'var(--background)' }}
          >
            <Plus size={15} /> Add a lot
          </button>
        ) : (
          <form action={addLot} className="p-5 flex flex-col gap-4" style={card}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Grade">
                <select
                  name="symbol"
                  required
                  defaultValue={choices[0]?.symbol}
                  className="w-full h-10 px-2 text-sm"
                  style={input}
                >
                  {choices.map((c) => (
                    <option key={c.symbol} value={c.symbol}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Quantity">
                <input
                  name="quantity"
                  type="number"
                  step="any"
                  min="0.0001"
                  required
                  className="w-full h-10 px-2 text-sm"
                  style={{ ...input, ...mono }}
                />
              </Field>
              <Field label="Unit">
                <select name="unit" defaultValue="TONS" className="w-full h-10 px-2 text-sm" style={input}>
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Cost / unit (optional)">
                <input
                  name="costBasis"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="leave blank for none"
                  className="w-full h-10 px-2 text-sm"
                  style={{ ...input, ...mono }}
                />
              </Field>
            </div>
            <Field label="Label (optional)">
              <input
                name="label"
                maxLength={120}
                placeholder="Bin 4 — radiators"
                className="w-full h-10 px-2 text-sm"
                style={input}
              />
            </Field>
            {error && (
              <p className="text-[13px]" style={{ color: 'var(--down)' }}>
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 text-sm font-medium disabled:opacity-60"
                style={{ background: 'var(--foreground)', color: 'var(--background)' }}
              >
                {busy ? 'Saving…' : 'Save lot'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdding(false)
                  setError(null)
                }}
                className="px-4 py-2 text-sm border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ---- lots ---- */}
      {lots.length === 0 ? (
        <div className="p-10 text-center" style={card}>
          <p className="text-base font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            No lots tracked yet
          </p>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Add what you&apos;re holding and it gets marked to market every day.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm" style={{ minWidth: 760 }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                {['Lot', 'Quantity', 'Price used', 'Market value', 'Cost', 'P&L', '', ''].map((h, i) => (
                  <th
                    key={`${h}-${i}`}
                    className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lots.map((l, i) => {
                const v = l.valuation
                const up = (v.unrealizedPnl ?? 0) >= 0
                return (
                  <tr
                    key={l.id}
                    style={{
                      background: 'var(--bg-primary)',
                      borderBottom: i < lots.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--text-primary)]">
                        {l.label ?? l.seriesLabel}
                      </div>
                      {l.label && <div className="text-xs text-[var(--text-tertiary)]">{l.seriesLabel}</div>}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-[var(--text-secondary)]" style={mono}>
                      {l.quantity.toLocaleString()} {l.unit}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-[var(--text-secondary)]" style={mono}>
                      {l.price !== null ? formatQuote(l.price, l.quoteUnit) : '—'}
                      {v.stale && (
                        <span className="ml-1 text-[10px] uppercase" style={{ color: 'var(--copper)' }}>
                          stale
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-[var(--text-primary)]" style={mono}>
                      {v.marketValue !== null ? (
                        usd(v.marketValue)
                      ) : (
                        <span className="font-normal text-[var(--text-tertiary)]">{v.reason ?? '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-[var(--text-secondary)]" style={mono}>
                      {v.costTotal !== null ? usd(v.costTotal) : '—'}
                    </td>
                    <td
                      className="px-4 py-3 tabular-nums"
                      style={{
                        ...mono,
                        color:
                          v.unrealizedPnl === null
                            ? 'var(--text-tertiary)'
                            : up
                              ? 'var(--up)'
                              : 'var(--down)',
                      }}
                    >
                      {v.unrealizedPnl !== null
                        ? `${up ? '▲ +' : '▼ −'}${usd(Math.abs(v.unrealizedPnl))}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {l.status === 'LISTED' ? (
                        <span
                          className="text-[11px] uppercase tracking-[0.1em]"
                          style={{ ...mono, color: 'var(--text-tertiary)' }}
                        >
                          Listed
                        </span>
                      ) : (
                        // Carries only the lot id; the wizard re-fetches the
                        // values through the company-scoped endpoint.
                        <Link
                          href={`/post-listing?lot=${l.id}`}
                          className="inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] uppercase tracking-[0.1em] transition-colors hover:bg-[var(--bg-tertiary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                          style={{ ...mono, borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                        >
                          <Tag size={12} /> List
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => removeLot(l.id)}
                        disabled={busy}
                        aria-label={`Remove ${l.label ?? l.seriesLabel}`}
                        className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--down)] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        Valuation only — a mark-to-market of material you have logged, not advice on whether to buy or
        sell. Lots are visible to your company alone and never appear in public market data.
      </p>
    </div>
  )
}

function Tile({
  label,
  value,
  note,
  tone = 'plain',
}: {
  label: string
  value: string
  note: string
  tone?: 'up' | 'down' | 'plain'
}) {
  return (
    <div className="p-4" style={{ background: 'var(--bg-secondary)' }}>
      <div className="text-[11px] uppercase tracking-[0.14em]" style={{ color: 'var(--text-tertiary)', ...mono }}>
        {label}
      </div>
      <div
        className="my-1 text-[24px] font-bold leading-tight tabular-nums"
        style={{
          ...mono,
          color: tone === 'up' ? 'var(--up)' : tone === 'down' ? 'var(--down)' : 'var(--text-primary)',
        }}
      >
        {value}
      </div>
      <div className="text-[12px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
        {note}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-[0.12em]" style={{ color: 'var(--text-tertiary)', ...mono }}>
        {label}
      </span>
      {children}
    </label>
  )
}
