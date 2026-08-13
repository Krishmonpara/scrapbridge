/**
 * Seeds the market intelligence tables from the sample generator.
 *
 * Run with:  npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-market.ts
 * or:        npm run db:seed:market
 *
 * Everything written here is marked source = SAMPLE. When a real feed lands
 * (Flag #3), write ticks with source = FEED and the UI stops showing the
 * sample banner on its own — no consumer changes.
 *
 * Safe to re-run: ticks and events upsert on their natural keys.
 */

import { PrismaClient } from '@prisma/client'
import { SAMPLE_SYMBOLS, sampleSeries } from '../lib/market/sample-data'

const prisma = new PrismaClient()

async function main() {
  let seriesCount = 0
  let tickCount = 0
  let eventCount = 0

  for (const symbol of SAMPLE_SYMBOLS) {
    const s = sampleSeries(symbol)
    if (!s) continue

    const series = await prisma.priceSeries.upsert({
      where: { symbol: s.symbol },
      update: { label: s.label, unit: s.unit, source: 'SAMPLE' },
      create: { symbol: s.symbol, label: s.label, unit: s.unit, source: 'SAMPLE' },
    })
    seriesCount++

    // Ticks are chunked: a 180-day series across 10 symbols is 1,800 rows and
    // a single createMany keeps the round-trips down.
    await prisma.priceTick.deleteMany({ where: { seriesId: series.id } })
    await prisma.priceTick.createMany({
      data: s.ticks.map((t) => ({
        seriesId: series.id,
        date: new Date(`${t.date}T00:00:00Z`),
        close: t.close,
      })),
      skipDuplicates: true,
    })
    tickCount += s.ticks.length

    await prisma.marketEvent.deleteMany({ where: { seriesId: series.id } })
    if (s.events.length > 0) {
      await prisma.marketEvent.createMany({
        data: s.events.map((e) => ({
          seriesId: series.id,
          date: new Date(`${e.date}T00:00:00Z`),
          category: e.category,
          headline: e.headline,
          body: e.body,
          impactPct: e.impactPct,
          sourceName: e.sourceName,
          sourceUrl: e.sourceUrl ?? null,
        })),
      })
      eventCount += s.events.length
    }

    console.log(`  ${s.symbol.padEnd(16)} ${s.ticks.length} ticks, ${s.events.length} events`)
  }

  console.log(
    `\nSeeded ${seriesCount} series, ${tickCount} ticks, ${eventCount} events (all source=SAMPLE).`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
