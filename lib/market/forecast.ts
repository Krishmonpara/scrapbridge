// Forward price projection.
//
// This is a RANDOM WALK WITH DRIFT, estimated from the series itself — the
// naive baseline, not a trained model. That is deliberate: per the build plan,
// nothing ships until a learned model demonstrably beats this baseline, so the
// baseline is what we show until then. `method` is carried all the way to the
// UI so a projection is never mistaken for a model prediction.
//
// Bands are lognormal quantiles: sigma scales with sqrt(horizon), which is why
// the fan widens. Drift is damped because a 60-day trend is a poor estimate of
// the next 30 days — undamped drift extrapolates a rally forever.

import type { Forecast, ForecastPoint, Tick } from './types'

const Z: Record<'p10' | 'p25' | 'p75' | 'p90', number> = {
  p10: -1.2815515655446004,
  p25: -0.6744897501960817,
  p75: 0.6744897501960817,
  p90: 1.2815515655446004,
}

/** Damping applied to estimated drift when projecting forward. */
const DRIFT_DAMPING = 0.35

function nextTradingDays(from: string, n: number): string[] {
  const out: string[] = []
  const d = new Date(`${from}T00:00:00Z`)
  while (out.length < n) {
    d.setUTCDate(d.getUTCDate() + 1)
    const day = d.getUTCDay()
    if (day !== 0 && day !== 6) out.push(d.toISOString().slice(0, 10))
  }
  return out
}

/**
 * Project `horizonDays` trading days forward from the last tick.
 * Returns null when there is not enough history to estimate volatility.
 */
export function forecastSeries(ticks: Tick[], horizonDays = 30): Forecast | null {
  if (ticks.length < 30) return null

  // log returns over the trailing window we trust
  const window = ticks.slice(-90)
  const rets: number[] = []
  for (let i = 1; i < window.length; i++) {
    const a = window[i - 1].close
    const b = window[i].close
    if (a > 0 && b > 0) rets.push(Math.log(b / a))
  }
  if (rets.length < 20) return null

  const mean = rets.reduce((s, r) => s + r, 0) / rets.length
  const variance = rets.reduce((s, r) => s + (r - mean) ** 2, 0) / (rets.length - 1)
  const sigmaDaily = Math.sqrt(variance)

  const last = ticks[ticks.length - 1]
  const drift = mean * DRIFT_DAMPING
  const dates = nextTradingDays(last.date, horizonDays)

  const points: ForecastPoint[] = dates.map((date, i) => {
    const h = i + 1
    const centre = Math.log(last.close) + drift * h
    const sd = sigmaDaily * Math.sqrt(h)
    const at = (z: number) => Math.exp(centre + z * sd)
    return {
      date,
      p10: round(at(Z.p10)),
      p25: round(at(Z.p25)),
      p50: round(Math.exp(centre)),
      p75: round(at(Z.p75)),
      p90: round(at(Z.p90)),
    }
  })

  return {
    method: 'random-walk-drift',
    runDate: last.date,
    points,
    sigmaAnnual: sigmaDaily * Math.sqrt(252),
    driftDaily: drift,
  }
}

function round(v: number): number {
  return Math.round(v * 10000) / 10000
}

/**
 * Walk-forward check of the same estimator against a persistence baseline
 * (tomorrow = today). Reported honestly: if `improvementPct` is <= 0 the
 * projection adds nothing over assuming no change, and the UI says so.
 */
export function backtest(ticks: Tick[], horizonDays = 30) {
  if (ticks.length < 90) return null
  let errModel = 0
  let errNaive = 0
  let n = 0
  let dirHits = 0

  for (let cut = 60; cut + horizonDays < ticks.length; cut += 5) {
    const hist = ticks.slice(0, cut)
    const actual = ticks[cut + horizonDays - 1].close
    const f = forecastSeries(hist, horizonDays)
    if (!f) continue
    const pred = f.points[f.points.length - 1].p50
    const naive = hist[hist.length - 1].close
    errModel += Math.abs(pred - actual) / actual
    errNaive += Math.abs(naive - actual) / actual
    if (Math.sign(pred - naive) === Math.sign(actual - naive)) dirHits++
    n++
  }
  if (!n) return null

  const mape = (errModel / n) * 100
  const mapeNaive = (errNaive / n) * 100
  return {
    samples: n,
    mape,
    mapeNaive,
    improvementPct: ((mapeNaive - mape) / mapeNaive) * 100,
    directionAccuracy: (dirHits / n) * 100,
  }
}
