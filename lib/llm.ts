// ─── Anthropic LLM Client ─────────────────────────────────────────────────────
// Wraps the @anthropic-ai/sdk to provide both a simple async query executor
// and a streaming variant that fires a callback for each text delta.

import Anthropic from '@anthropic-ai/sdk'

// ── Client singleton ─────────────────────────────────────────────────────────

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// ── Constants ─────────────────────────────────────────────────────────────────

export const DEFAULT_MODEL = 'claude-opus-4-7'
const DEFAULT_MAX_TOKENS = 16000

// ── Non-streaming query ───────────────────────────────────────────────────────

/**
 * Execute a query against the Anthropic API and return the complete response
 * text.  Uses extended thinking (adaptive) for deep reasoning.
 *
 * @param systemPrompt  The system-turn prompt.
 * @param userPrompt    The user-turn prompt containing context + question.
 * @param maxTokens     Maximum tokens for the response (default 16 000).
 * @param model         Claude model to use (default claude-opus-4-6).
 * @returns             The assistant's full text response.
 */
export async function executeQuery(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = DEFAULT_MAX_TOKENS,
  model: string = DEFAULT_MODEL
): Promise<string> {
  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  })

  // Collect text blocks from the response
  const textParts: string[] = []
  for (const block of response.content) {
    if (block.type === 'text') {
      textParts.push(block.text)
    }
  }

  const result = textParts.join('\n').trim()
  if (!result) {
    console.error('[executeQuery] No text blocks in response. stop_reason:', response.stop_reason, 'content types:', response.content.map(b => b.type))
    throw new Error('The model returned an empty response. Please try again.')
  }

  return result
}

// ── Streaming query ───────────────────────────────────────────────────────────

/**
 * Execute a query with streaming and call `onDelta` for every text delta
 * received.  Returns the accumulated full text when the stream completes.
 *
 * Thinking blocks are NOT streamed to the caller — only text content is.
 *
 * @param systemPrompt  The system-turn prompt.
 * @param userPrompt    The user-turn prompt containing context + question.
 * @param onDelta       Callback invoked with each incremental text chunk.
 * @param maxTokens     Maximum tokens for the response (default 16 000).
 * @returns             The full accumulated text response.
 */
export async function executeQueryStream(
  systemPrompt: string,
  userPrompt: string,
  onDelta: (text: string) => void,
  maxTokens: number = DEFAULT_MAX_TOKENS,
  model: string = DEFAULT_MODEL
): Promise<string> {
  let fullText = ''
  let inThinkingBlock = false

  const stream = anthropic.messages.stream({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  })

  for await (const event of stream) {
    // Track block type changes to skip thinking content
    if (event.type === 'content_block_start') {
      inThinkingBlock = event.content_block.type === 'thinking'
    }

    if (event.type === 'content_block_stop') {
      inThinkingBlock = false
    }

    if (event.type === 'content_block_delta' && !inThinkingBlock) {
      const delta = event.delta
      if (delta.type === 'text_delta') {
        onDelta(delta.text)
        fullText += delta.text
      }
    }
  }

  return fullText
}
