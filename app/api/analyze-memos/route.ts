import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/llm'

// ─── CORS Headers ─────────────────────────────────────────────────────────────
// Allow the standalone expense_dashboard.html to call this endpoint from any origin.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface TxnInput {
  id: string
  merchant: string
  category: string
  memo: string
}

interface TxnResult {
  id: string
  confirmed: boolean   // true = genuine mismatch, false = category is fine
  reason: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BATCH_SIZE = 60

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

async function analyzeBatch(txns: TxnInput[]): Promise<TxnResult[]> {
  const systemPrompt = `You are a senior corporate expense auditor performing a SOX compliance review.
Your job is to assess whether an employee's memo/description genuinely conflicts with the assigned spend category.

Rules:
- "confirmed: true"  → the memo clearly implies a DIFFERENT category than what was assigned (real mismatch worth flagging)
- "confirmed: false" → the category is correct or plausible given the memo, OR the memo is too vague to judge
- Be lenient: only flag clear, unambiguous conflicts. Err on the side of false when unsure.
- Common acceptable combos: Uber/Lyft memos under "Taxi and Rideshare", restaurant names under "Meals", SaaS tools under "Software".

Return ONLY a valid JSON array — no markdown fences, no explanation outside the array.`

  const userPrompt = `Analyze these ${txns.length} transactions and return a JSON array of results.

Each result must have:
  "id": (string, exact match from input),
  "confirmed": (boolean),
  "reason": (string, one concise sentence, max 15 words)

Transactions:
${JSON.stringify(txns, null, 2)}`

  const raw = await executeQuery(systemPrompt, userPrompt, 4096, 'claude-sonnet-4-6')

  // Strip any accidental markdown fences
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()

  let parsed: TxnResult[]
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    // Attempt to extract JSON array from the response
    const match = cleaned.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('Claude returned non-JSON response')
    parsed = JSON.parse(match[0])
  }

  // Ensure every input ID has a result (fill missing ones as not confirmed)
  const resultMap = new Map(parsed.map(r => [r.id, r]))
  return txns.map(t => resultMap.get(t.id) ?? { id: t.id, confirmed: false, reason: 'Unable to determine' })
}

// ─── POST /api/analyze-memos ──────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: corsHeaders })
    }

    const { transactions } = body as { transactions?: unknown }

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: '`transactions` must be a non-empty array' }, { status: 400, headers: corsHeaders })
    }

    // Validate + sanitise each transaction
    const txns: TxnInput[] = (transactions as TxnInput[]).map((t, i) => ({
      id:       String(t.id       ?? i),
      merchant: String(t.merchant ?? '').slice(0, 80),
      category: String(t.category ?? '').slice(0, 60),
      memo:     String(t.memo     ?? '').slice(0, 200),
    }))

    // Process in batches to stay well within token limits
    const batches  = chunkArray(txns, BATCH_SIZE)
    const allResults: TxnResult[] = []

    for (const batch of batches) {
      const results = await analyzeBatch(batch)
      allResults.push(...results)
    }

    return NextResponse.json({ results: allResults }, { headers: corsHeaders })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[analyze-memos]', message)
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders })
  }
}
