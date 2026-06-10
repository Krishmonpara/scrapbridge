'use client'

import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CATEGORY_LABELS, MaterialCategory, ListingFilters as Filters } from '@/types'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

interface ListingFiltersProps {
  filters: Filters
  onChange: (filters: Filters) => void
  resultCount: number
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        {title}
        <ChevronDown
          size={14}
          className="transition-transform duration-150"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
        />
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  )
}

export function ListingFilters({ filters, onChange, resultCount }: ListingFiltersProps) {
  const update = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })
  const LISTING_TYPES = ['SELL', 'BUY', 'WANTED', 'AUCTION'] as const
  const CONDITIONS = ['COMPLETE', 'PARTIAL', 'DAMAGED', 'AS_IS', 'SCRAP_ONLY'] as const
  const CONDITION_LABELS_MAP = {
    COMPLETE: 'Complete',
    PARTIAL: 'Partial',
    DAMAGED: 'Damaged',
    AS_IS: 'As-Is',
    SCRAP_ONLY: 'Scrap Only',
  }

  return (
    <aside
      className="w-70 shrink-0 flex flex-col"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 4 }}
    >
      <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Filters</p>
          <p className="text-xs text-[var(--text-tertiary)]">{resultCount.toLocaleString()} results</p>
        </div>
        <button
          onClick={() => onChange({})}
          className="text-xs text-[var(--accent)] hover:underline"
        >
          Clear all
        </button>
      </div>

      <div className="flex flex-col px-4 overflow-y-auto flex-1">
        <Section title="Listing Type">
          <div className="flex flex-wrap gap-1.5">
            {LISTING_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => update({ listingType: filters.listingType === type ? undefined : type })}
                className="px-3 py-1 text-xs rounded-sm border transition-all duration-150"
                style={{
                  background: filters.listingType === type ? 'var(--accent-glow)' : 'var(--bg-tertiary)',
                  borderColor: filters.listingType === type ? 'var(--accent)' : 'var(--border)',
                  color: filters.listingType === type ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Material Category">
          <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
            {(Object.entries(CATEGORY_LABELS) as [MaterialCategory, string][]).map(([cat, label]) => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.materialCategory === cat}
                  onChange={() => update({ materialCategory: filters.materialCategory === cat ? undefined : cat })}
                  className="accent-[var(--accent)] w-3.5 h-3.5"
                />
                <span className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </Section>

        <Section title="Condition">
          <div className="flex flex-col gap-1">
            {CONDITIONS.map((cond) => (
              <label key={cond} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.condition?.includes(cond) ?? false}
                  onChange={() => {
                    const current = filters.condition ?? []
                    const next = current.includes(cond)
                      ? current.filter((c) => c !== cond)
                      : [...current, cond]
                    update({ condition: next.length ? next : undefined })
                  }}
                  className="accent-[var(--accent)] w-3.5 h-3.5"
                />
                <span className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                  {CONDITION_LABELS_MAP[cond]}
                </span>
              </label>
            ))}
          </div>
        </Section>

        <Section title="Location">
          <select
            value={filters.state ?? ''}
            onChange={(e) => update({ state: e.target.value || undefined })}
            className="w-full h-8 bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] text-xs rounded-sm px-2 focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">All States</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Section>

        <Section title="Seller Status">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.verifiedOnly ?? false}
              onChange={(e) => update({ verifiedOnly: e.target.checked || undefined })}
              className="accent-[var(--accent)] w-3.5 h-3.5"
            />
            <span className="text-xs text-[var(--text-secondary)]">Verified sellers only</span>
          </label>
        </Section>

        <Section title="Posted Within">
          <div className="flex flex-col gap-1">
            {(['24h', '7d', '30d', 'all'] as const).map((period) => {
              const labels = { '24h': 'Last 24 hours', '7d': 'Last 7 days', '30d': 'Last 30 days', 'all': 'Any time' }
              return (
                <label key={period} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    checked={(filters.postedWithin ?? 'all') === period}
                    onChange={() => update({ postedWithin: period === 'all' ? undefined : period })}
                    className="accent-[var(--accent)] w-3.5 h-3.5"
                  />
                  <span className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                    {labels[period]}
                  </span>
                </label>
              )
            })}
          </div>
        </Section>
      </div>
    </aside>
  )
}
