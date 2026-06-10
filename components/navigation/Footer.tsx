'use client'

import Link from 'next/link'
import { CATEGORY_LABELS, MaterialCategory } from '@/types'

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [MaterialCategory, string][]

export function Footer() {
  return (
    <footer
      className="py-12 bg-[var(--bg-secondary)] border-t border-[var(--border)] mt-auto"
    >
      <div className="px-6 max-w-screen-xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-8 h-8 rounded flex items-center justify-center font-bold text-sm"
                style={{ background: 'var(--foreground)', color: 'var(--background)' }}
              >
                SB
              </span>
              <span className="font-semibold text-[var(--text-primary)]">ScrapBridge</span>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] leading-relaxed max-w-xs mb-4">
              The world&apos;s B2B marketplace for scrap metals, industrial equipment, and surplus materials.
            </p>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
              }}
            >
              <input
                type="email"
                placeholder="your@company.com"
                className="flex-1 h-8 bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs px-2 rounded-sm focus:border-[var(--accent)] focus:outline-none transition-colors"
              />
              <button
                type="submit"
                className="h-8 px-3 text-xs font-medium rounded-sm transition-colors cursor-pointer"
                style={{ background: 'var(--foreground)', color: 'var(--background)' }}
              >
                Subscribe
              </button>
            </form>
          </div>

          {/* Categories */}
          <FooterCol title="Categories">
            {CATEGORIES.slice(0, 7).map(([cat, label]) => (
              <FooterLink key={cat} href={`/browse?category=${cat}`}>
                {label}
              </FooterLink>
            ))}
          </FooterCol>

          {/* Company */}
          <FooterCol title="Company">
            {['About', 'Careers', 'Press', 'Partners', 'API'].map((l) => (
              <FooterLink key={l} href={`/${l.toLowerCase()}`}>
                {l}
              </FooterLink>
            ))}
          </FooterCol>

          {/* Legal */}
          <FooterCol title="Legal">
            {['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'DMCA'].map((l) => (
              <FooterLink key={l} href={`/${l.toLowerCase().replace(/ /g, '-')}`}>
                {l}
              </FooterLink>
            ))}
          </FooterCol>
        </div>

        <div className="flex items-center justify-between pt-6 text-xs text-[var(--text-tertiary)] border-t border-[var(--border)]">
          <span>© 2025 ScrapBridge Inc. All rights reserved.</span>
          <span>Built for the industrial economy</span>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">{title}</p>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] hover:translate-x-0.5 transition-all duration-150 inline-block"
    >
      {children}
    </Link>
  )
}
