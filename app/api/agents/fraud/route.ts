import { runFraudAgent } from '@/lib/agents/fraud-agent'

// GET /api/agents/fraud → run the scan and return flagged listings
export async function GET() {
  try {
    const flags = await runFraudAgent()
    return Response.json({ flags, scannedAt: new Date().toISOString() })
  } catch {
    return Response.json({ error: 'Fraud scan failed' }, { status: 500 })
  }
}
