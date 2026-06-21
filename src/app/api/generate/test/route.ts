import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { getAIModel } from '@/lib/ai-provider'

/**
 * GET /api/generate/test
 * Quick smoke-test that AI provider works.
 * Returns { ok: true, preview: "first 200 chars of HTML" } or { ok: false, error: "..." }
 */
export async function GET(request: NextRequest) {
  try {
    // 1x1 white PNG in base64 – minimal valid image
    const tiny1x1png =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg=='

    const { text } = await generateText({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: getAIModel() as any,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Generate a minimal single-div HTML snippet that says "AI Vision works!" in a styled box. Return ONLY the HTML, no explanation.',
            },
            {
              type: 'image',
              image: tiny1x1png,
            },
          ],
        },
      ],
      maxOutputTokens: 200,
    })

    return NextResponse.json({
      ok: true,
      model: process.env.AI_PROVIDER || 'google',
      preview: text.slice(0, 300),
      length: text.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
