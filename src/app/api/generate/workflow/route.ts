/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { streamText } from 'ai'
import { prompts } from '@/prompts'
import {
  StyleGuideQuery,
  InspirationImagesQuery,
} from '@/convex/query.config'
import { getAIModel } from '@/lib/ai-provider'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { generatedUIId, currentHTML, projectId, pageIndex } = body
    console.log("DEBUG: /api/generate/workflow request body:", { generatedUIId, currentHTMLExists: !!currentHTML, projectId, pageIndex });

    if (
      !generatedUIId ||
      !currentHTML ||
      !projectId ||
      pageIndex === undefined
    ) {
      console.log("DEBUG: /api/generate/workflow missing required fields");
      return NextResponse.json(
        {
          error:
            'Missing required fields: generatedUIId, currentHTML, projectId, pageIndex',
        },
        { status: 400 }
      )
    }

    // Get style guide
    const styleGuide = await StyleGuideQuery(projectId)
    const styleGuideData = styleGuide?.styleGuide?._valueJSON as unknown as {
      colorSections: unknown[]
      typographySections: unknown[]
    }

    // Get inspiration images
    const inspirationResult = await InspirationImagesQuery(projectId)
    const images = (inspirationResult?.images?._valueJSON || []) as unknown as {
      url: string
    }[]
    const imageUrls = images.map((img) => img.url).filter((url): url is string => !!url)

    const colors = styleGuideData?.colorSections || []
    const typography = styleGuideData?.typographySections || []

    const pageTypes = [
      'Dashboard/Analytics page with charts, metrics, and KPIs',
      'Settings/Configuration page with preferences and account management',
      'User Profile page with personal information and activity',
      'Data Listing/Table page with search, filters, and pagination',
    ]

    const selectedPageType = pageTypes[pageIndex] || pageTypes[0]

    let userPrompt = `You are an expert UI/UX developer. Create a workflow page that complements the provided main page design.

MAIN PAGE REFERENCE (for design consistency):
${currentHTML.substring(0, 2000)}...

WORKFLOW PAGE TO GENERATE: "${selectedPageType}"

REQUIREMENTS:
1. Analyze the main page design and match its visual language exactly
2. Create a fitting ${selectedPageType} that feels like a natural extension
3. Use the EXACT same color scheme, typography, and component style
4. Generate clean, semantic HTML with Tailwind CSS classes
5. Include realistic, contextually appropriate content
6. Return ONLY the HTML – no markdown fences, no explanations`

    if (colors.length > 0) {
      userPrompt += `\n\nColors:\n${(
        colors as Array<{
          swatches: Array<{
            name: string
            hexColor: string
            description: string
          }>
        }>
      )
        .map((color) =>
          color.swatches
            .map(
              (swatch) =>
                `${swatch.name}: ${swatch.hexColor}, ${swatch.description}`
            )
            .join(', ')
        )
        .join(', ')}`
    }

    if (typography.length > 0) {
      userPrompt += `\n\nTypography:\n${(
        typography as Array<{
          styles: Array<{
            name: string
            description: string
            fontFamily: string
            fontWeight: string
            fontSize: string
            lineHeight: string
          }>
        }>
      )
        .map((typo) =>
          typo.styles
            .map(
              (style) =>
                `${style.name}: ${style.description}, ${style.fontFamily}, ${style.fontWeight}, ${style.fontSize}, ${style.lineHeight}`
            )
            .join(', ')
        )
        .join(', ')}`
    }

    userPrompt += `\n\nGenerate the complete HTML for the ${selectedPageType} now:`

    // Build content array
    const contentParts: any[] = [{ type: 'text', text: userPrompt }]

    // Add inspiration images as URLs
    for (const url of imageUrls.slice(0, 2)) {
      try {
        contentParts.push({ type: 'image', image: new URL(url) })
      } catch {
        // Skip invalid URLs
      }
    }

    const result = streamText({
      model: getAIModel() as any,
      messages: [{ role: 'user', content: contentParts }],
      system: prompts.generativeUi.system,
      temperature: 0.7,
      maxOutputTokens: 8192,
    })

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            const encoder = new TextEncoder()
            controller.enqueue(encoder.encode(chunk))
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Workflow generation API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process workflow generation request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
