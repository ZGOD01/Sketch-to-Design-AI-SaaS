/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateObject } from 'ai'
import { MoodBoardImagesQuery } from '@/convex/query.config'
import { MoodBoardImage } from '@/hooks/use-styles'
import { prompts } from '@/prompts'
import { NextRequest, NextResponse } from 'next/server'
import { getAIModel } from '@/lib/ai-provider'
import { fetchMutation } from 'convex/nextjs'
import { api } from '../../../../../convex/_generated/api'
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server'
import { Id } from '../../../../../convex/_generated/dataModel'
import z from 'zod'

const ColorSwatchSchema = z.object({
  name: z.string(),
  hexColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be valid hex color'),
  description: z.string().optional(),
})

const ColorSectionSchema = z.object({
  title: z.union([
    z.literal('Primary Colours'),
    z.literal('Secondary & Accent Colors'),
    z.literal('UI Component Colors'),
    z.literal('Utility & Form Colors'),
    z.literal('Status & Feedback Colors'),
  ]),
  swatches: z.array(ColorSwatchSchema),
})

const TypographyStyleSchema = z.object({
  name: z.string(),
  fontFamily: z.string(),
  fontSize: z.string(),
  fontWeight: z.string(),
  lineHeight: z.string(),
  letterSpacing: z.string().optional(),
  description: z.string().optional(),
})

const TypographySectionSchema = z.object({
  title: z.string(),
  styles: z.array(TypographyStyleSchema),
})

const StyleGuideSchema = z.object({
  theme: z.string(),
  description: z.string(),
  colorSections: z.array(ColorSectionSchema),
  typographySections: z.array(TypographySectionSchema),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId } = body
    if (!projectId || projectId === "null") {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const moodBoardImages = await MoodBoardImagesQuery(projectId)
    if (!moodBoardImages?.images || moodBoardImages.images._valueJSON.length === 0) {
      return NextResponse.json(
        {
          error:
            'No mood board images found. Please upload images to the mood board first.',
        },
        { status: 400 }
      )
    }
    const images = moodBoardImages.images
      ._valueJSON as unknown as MoodBoardImage[]
    const imageUrls = images.map((img) => img.url).filter((url): url is string => !!url)
    if (imageUrls.length === 0) {
      return NextResponse.json(
        { error: 'No valid image URLs found in mood board' },
        { status: 400 }
      )
    }
    const systemPrompt = prompts.styleGuide.system

    const userPrompt = `Analyze these ${imageUrls.length} mood board images and generate a design system. Extract colors that work harmoniously together and create typography that matches the aesthetic. Return ONLY the JSON object matching the exact schema structure.`

    // Build content with image URLs
    const contentParts: any[] = [{ type: 'text', text: userPrompt }]
    for (const url of imageUrls) {
      try {
        contentParts.push({ type: 'image', image: new URL(url) })
      } catch {
        // Skip invalid URLs
      }
    }

    const result = await generateObject({
      model: getAIModel() as any,
      schema: StyleGuideSchema,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: contentParts,
        },
      ],
    })

    const token = await convexAuthNextjsToken()

    await fetchMutation(
      api.projects.updateProjectStyleGuide,
      {
        projectId: projectId as Id<'projects'>,
        styleGuideData: result.object,
      },
      { token }
    )

    return NextResponse.json({
      success: true,
      styleGuide: result.object,
      message: 'Style guide generated successfully',
      balance: 9999,
    })
  } catch (error) {
    console.error('Error generating style guide:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate style guide',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
