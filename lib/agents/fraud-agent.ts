// Fraud Detection Agent — scans active listings for risk signals and
// returns flagged results for the admin review queue. Signals are
// heuristic and explainable; each flag carries its reasons so a human
// reviewer can act quickly.

import { prisma } from '@/lib/prisma'
import { getPriceSignal } from '@/lib/agents/price-intelligence'

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW'

export interface FraudFlag {
  listingId: string
  title: string
  companyId: string
  companyName: string
  risk: RiskLevel
  signals: string[]
}

const HIGH_VALUE_USD = 50000

export async function runFraudAgent(): Promise<FraudFlag[]> {
  const listings = await prisma.listing.findMany({
    where: { status: 'ACTIVE' },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          verificationStatus: true,
          memberSince: true,
          phone: true,
          website: true,
        },
      },
    },
  })

  const flags: FraudFlag[] = []

  // duplicate detection: same company + near-identical title
  const seenTitles = new Map<string, string>() // normalized title+company → listingId
  const duplicateIds = new Set<string>()
  for (const l of listings) {
    const key = `${l.companyId}:${l.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60)}`
    if (seenTitles.has(key)) {
      duplicateIds.add(l.id)
      duplicateIds.add(seenTitles.get(key)!)
    } else {
      seenTitles.set(key, l.id)
    }
  }

  const now = Date.now()

  for (const l of listings) {
    const signals: string[] = []

    // extreme underpricing vs spot reference (classic scam bait)
    const priceSignal = getPriceSignal(l as Parameters<typeof getPriceSignal>[0])
    if (priceSignal.verdict === 'BELOW_MARKET' && (priceSignal.deviationPct ?? 0) <= -60) {
      signals.push(`Priced ${Math.abs(priceSignal.deviationPct!)}% below market midpoint`)
    }

    // high-value lot from a brand-new, unverified account
    const totalValue = (l.pricePerUnit ?? 0) * l.quantity
    const accountAgeDays = (now - new Date(l.company.memberSince).getTime()) / 86400000
    if (totalValue >= HIGH_VALUE_USD && l.company.verificationStatus === 'UNVERIFIED') {
      if (accountAgeDays < 30) {
        signals.push(`$${Math.round(totalValue).toLocaleString()} lot from unverified account <30 days old`)
      } else {
        signals.push(`$${Math.round(totalValue).toLocaleString()} lot from unverified account`)
      }
    }

    // missing contact surface (no phone AND no website)
    if (!l.company.phone && !l.company.website && totalValue >= HIGH_VALUE_USD) {
      signals.push('High-value listing but company has no phone or website on file')
    }

    // duplicate listing spam
    if (duplicateIds.has(l.id)) {
      signals.push('Near-duplicate of another listing by the same company')
    }

    // unrealistic quantity (fat-finger or fake supply)
    if (l.unit === 'TONS' && l.quantity > 50000) {
      signals.push(`Quantity ${l.quantity.toLocaleString()} tons exceeds plausible single-lot supply`)
    }

    if (signals.length === 0) continue

    const risk: RiskLevel =
      signals.length >= 3 ? 'HIGH' : signals.length === 2 ? 'MEDIUM' : 'LOW'

    flags.push({
      listingId: l.id,
      title: l.title,
      companyId: l.company.id,
      companyName: l.company.name,
      risk,
      signals,
    })
  }

  const order: Record<RiskLevel, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }
  return flags.sort((a, b) => order[a.risk] - order[b.risk])
}
