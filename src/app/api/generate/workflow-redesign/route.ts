/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { prompts } from "@/prompts";
import { getAIModel } from "@/lib/ai-provider";
import { StyleGuideQuery } from "@/convex/query.config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userMessage, generatedUIId, currentHTML, projectId } = body;

    if (!userMessage || !generatedUIId || !currentHTML || !projectId) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: userMessage, generatedUIId, currentHTML, projectId",
        },
        { status: 400 }
      );
    }

    const styleGuide = await StyleGuideQuery(projectId);
    const styleGuideData = styleGuide?.styleGuide?._valueJSON as unknown as {
      colorSections: unknown[];
      typographySections: unknown[];
    };
    const colorSections = styleGuideData?.colorSections || [];
    const typographySections = styleGuideData?.typographySections || [];

    const userPrompt = `CRITICAL: You are redesigning a SPECIFIC WORKFLOW PAGE, not creating a new page from scratch.

USER REQUEST: "${userMessage}"

CURRENT WORKFLOW PAGE HTML TO REDESIGN:
${currentHTML}

WORKFLOW REDESIGN REQUIREMENTS:
1. MODIFY THE PROVIDED HTML ABOVE - do not create a completely new page
2. Apply the user's requested changes to the existing workflow page design
3. Keep the same page type and core functionality
4. Maintain the existing layout structure and component hierarchy
5. Preserve all functional elements while applying visual/content changes

MODIFICATION GUIDELINES:
1. Start with the provided HTML structure as your base
2. Apply the requested changes (colors, layout, content, styling, etc.)
3. Keep all existing IDs and semantic structure intact
4. Maintain component patterns and classes
5. Preserve responsive design and accessibility features

Colors: ${colorSections
      .map((color: any) =>
        color.swatches
          .map((swatch: any) => {
            return `${swatch.name}: ${swatch.hexColor}, ${swatch.description}`;
          })
          .join(", ")
      )
      .join(", ")}
Typography: ${typographySections
      .map((typography: any) =>
        typography.styles
          .map((style: any) => {
            return `${style.name}: ${style.description}, ${style.fontFamily}, ${style.fontWeight}, ${style.fontSize}, ${style.lineHeight}`;
          })
          .join(", ")
      )
      .join(", ")}

Return ONLY the complete HTML – no markdown fences, no explanations. Begin now:`;

    const result = streamText({
      model: getAIModel() as any,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: userPrompt }],
        },
      ],
      system: prompts.generativeUi.system,
      temperature: 0.7,
      maxOutputTokens: 8192,
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Workflow redesign API error:", error);
    return NextResponse.json(
      {
        error: "Failed to process workflow redesign request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
