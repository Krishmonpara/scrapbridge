/**
 * Unit-conversion and valuation tests.
 *
 * Run: npm run test:valuation
 *
 * Uses ts-node (already used by the seed scripts) and node:assert rather than
 * pulling in a test framework — this project has no runner and one module does
 * not justify adding one. Runs with --transpile-only so the type-only import of
 * QuoteUnit is erased and no path-alias resolution is needed; `tsc --noEmit`
 * over the whole project still covers the types.
 *
 * These exist because a wrong conversion factor here reports the wrong number
 * to a dealer about their own inventory, which is the worst failure this
 * feature has.
 */

import assert from 'node:assert'
import { toPounds, valueLot, totalPosition, STALE_AFTER_DAYS } from '../lib/position/valuation'

let passed = 0
let failed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    passed++
    console.log(`  ok   ${name}`)
  } catch (e) {
    failed++
    console.log(`  FAIL ${name}`)
    console.log(`       ${(e as Error).message}`)
  }
}

const near = (a: number | null, b: number, tol = 0.01) => {
  assert.ok(a !== null, 'expected a value, got null')
  assert.ok(Math.abs(a - b) <= tol, `expected ~${b}, got ${a}`)
}

console.log('\nunit conversion')
test('a short ton is 2000 lb', () => near(toPounds(1, 'TONS'), 2000))
test('pounds pass through', () => near(toPounds(500, 'LBS'), 500))
test('a kilo is 2.2046 lb', () => near(toPounds(1, 'KG'), 2.2046, 0.0001))
test('42 short tons is 84,000 lb', () => near(toPounds(42, 'TONS'), 84_000))
test('pieces have no weight', () => assert.strictEqual(toPounds(10, 'PIECES'), null))
test('lots have no weight', () => assert.strictEqual(toPounds(1, 'LOT'), null))
test('negative quantity is rejected', () => assert.strictEqual(toPounds(-5, 'TONS'), null))

console.log('\nvaluation across quote units')
test('42 t of copper at $6.21/lb = $521,640', () => {
  const v = valueLot({ quantity: 42, unit: 'TONS' }, 6.21, 'USD_LB', '2026-08-12', new Date('2026-08-13'))
  near(v.marketValue, 42 * 2000 * 6.21)
})
test('100 t of HMS at $412/short ton = $41,200', () => {
  const v = valueLot({ quantity: 100, unit: 'TONS' }, 412, 'USD_TON', '2026-08-12', new Date('2026-08-13'))
  near(v.marketValue, 41_200)
})
test('USD_CWT prices per 100 lb', () => {
  const v = valueLot({ quantity: 1, unit: 'TONS' }, 10, 'USD_CWT', '2026-08-12', new Date('2026-08-13'))
  near(v.marketValue, 200) // 2000 lb = 20 cwt x $10
})
test('kg lots convert correctly', () => {
  const v = valueLot({ quantity: 1000, unit: 'KG' }, 2, 'USD_LB', '2026-08-12', new Date('2026-08-13'))
  near(v.marketValue, 1000 * 2.2046226218 * 2)
})

console.log('\nP&L honesty')
test('no cost basis means no P&L, not a zero', () => {
  const v = valueLot({ quantity: 10, unit: 'TONS' }, 6, 'USD_LB', '2026-08-12', new Date('2026-08-13'))
  assert.strictEqual(v.costTotal, null)
  assert.strictEqual(v.unrealizedPnl, null)
  assert.ok(v.marketValue !== null)
})
test('cost basis yields signed P&L', () => {
  const v = valueLot({ quantity: 1, unit: 'TONS', costBasis: 5 }, 6, 'USD_LB', '2026-08-12', new Date('2026-08-13'))
  near(v.costTotal, 5) // $5/ton x 1 ton
  near(v.marketValue, 12_000) // 2000 lb x $6
  near(v.unrealizedPnl, 11_995)
})
test('a loss reports negative', () => {
  const v = valueLot({ quantity: 1, unit: 'LBS', costBasis: 10 }, 4, 'USD_LB', '2026-08-12', new Date('2026-08-13'))
  near(v.unrealizedPnl, -6)
  near(v.unrealizedPct, -60)
})

console.log('\nmissing and stale prices')
test('no price yields null value, not zero', () => {
  const v = valueLot({ quantity: 10, unit: 'TONS' }, null, 'USD_LB', null, new Date('2026-08-13'))
  assert.strictEqual(v.marketValue, null)
  assert.ok(v.reason && v.reason.length > 0)
})
test('cost survives a missing price', () => {
  const v = valueLot({ quantity: 2, unit: 'TONS', costBasis: 100 }, null, 'USD_LB', null)
  near(v.costTotal, 200)
  assert.strictEqual(v.marketValue, null)
})
test('a fresh price is not stale', () => {
  const v = valueLot({ quantity: 1, unit: 'TONS' }, 6, 'USD_LB', '2026-08-12', new Date('2026-08-13'))
  assert.strictEqual(v.stale, false)
})
test(`a price older than ${STALE_AFTER_DAYS}d is stale`, () => {
  const v = valueLot({ quantity: 1, unit: 'TONS' }, 6, 'USD_LB', '2026-08-01', new Date('2026-08-13'))
  assert.strictEqual(v.stale, true)
})
test('zero and negative prices are refused', () => {
  assert.strictEqual(valueLot({ quantity: 1, unit: 'TONS' }, 0, 'USD_LB', '2026-08-12').marketValue, null)
  assert.strictEqual(valueLot({ quantity: 1, unit: 'TONS' }, -3, 'USD_LB', '2026-08-12').marketValue, null)
})
test('pieces cannot be valued but say why', () => {
  const v = valueLot({ quantity: 5, unit: 'PIECES' }, 6, 'USD_LB', '2026-08-12')
  assert.strictEqual(v.marketValue, null)
  assert.match(v.reason ?? '', /piece/i)
})

console.log('\nportfolio totals')
test('totals sum only valued lots and count the rest', () => {
  const now = new Date('2026-08-13')
  const vals = [
    valueLot({ quantity: 1, unit: 'TONS', costBasis: 1000 }, 1, 'USD_TON', '2026-08-12', now), // mv 1
    valueLot({ quantity: 5, unit: 'PIECES' }, 6, 'USD_LB', '2026-08-12', now), // unvalued
    valueLot({ quantity: 2, unit: 'TONS' }, 100, 'USD_TON', '2026-08-12', now), // mv 200, no cost
  ]
  const t = totalPosition(vals)
  near(t.marketValue, 201)
  assert.strictEqual(t.unvaluedCount, 1)
  assert.strictEqual(t.lotCount, 3)
  // only the lot WITH a basis contributes to P&L
  near(t.costTotal, 1000)
  near(t.unrealizedPnl, 1 - 1000)
})
test('an all-unvalued portfolio is zero, not NaN', () => {
  const t = totalPosition([valueLot({ quantity: 5, unit: 'LOT' }, 6, 'USD_LB', '2026-08-12')])
  assert.strictEqual(t.marketValue, 0)
  assert.strictEqual(t.unrealizedPct, null)
  assert.strictEqual(t.unvaluedCount, 1)
})
test('stale lots are counted', () => {
  const now = new Date('2026-08-13')
  const t = totalPosition([
    valueLot({ quantity: 1, unit: 'TONS' }, 5, 'USD_TON', '2026-07-01', now),
    valueLot({ quantity: 1, unit: 'TONS' }, 5, 'USD_TON', '2026-08-12', now),
  ])
  assert.strictEqual(t.staleCount, 1)
})

console.log(`\n${passed} passed, ${failed} failed\n`)
process.exit(failed > 0 ? 1 : 0)
