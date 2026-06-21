/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { prompts } from "@/prompts";
import { getAIModel } from "@/lib/ai-provider";
import {
  StyleGuideQuery,
  InspirationImagesQuery,
} from "@/convex/query.config";

async function fetchImageAsUint8Array(url: string): Promise<{ data: Uint8Array; mimeType: string } | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`[fetchImageAsUint8Array] Failed to fetch: ${res.status} ${res.statusText}`)
      return null
    }
    const contentType = res.headers.get('content-type') || 'image/png'
    const buffer = await res.arrayBuffer()
    return {
      data: new Uint8Array(buffer),
      mimeType: contentType,
    }
  } catch (error) {
    console.error(`[fetchImageAsUint8Array] Error fetching ${url}:`, error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userMessage,
      generatedUIId,
      currentHTML,
      wireframeSnapshot,
      projectId,
    } = body;

    if (!userMessage || !generatedUIId || !projectId) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: userMessage, generatedUIId, projectId",
        },
        { status: 400 }
      );
    }

    // Get style guide
    const styleGuide = await StyleGuideQuery(projectId);
    const styleGuideData = styleGuide?.styleGuide?._valueJSON as unknown as {
      colorSections: unknown[];
      typographySections: unknown[];
    };

    // Get inspiration images
    const inspirationResult = await InspirationImagesQuery(projectId);
    const images = (inspirationResult?.images?._valueJSON || []) as unknown as {
      url: string;
    }[];
    const imageUrls = images.map((img) => img.url).filter((url): url is string => !!url);

    const colors = styleGuideData?.colorSections || [];
    const typography = styleGuideData?.typographySections || [];

    let userPrompt = `You are an expert UI/UX developer. Please redesign this UI based on my request: "${userMessage}"`;

    if (currentHTML) {
      userPrompt += `\n\nCurrent HTML for reference:\n${currentHTML.substring(0, 1500)}...`;
    }

    if (wireframeSnapshot) {
      userPrompt += `\n\nI'm also providing the original wireframe image as visual context for the layout and structure.`;
    }

    if (colors.length > 0) {
      userPrompt += `\n\nStyle Guide Colors:\n${(
        colors as Array<{
          swatches: Array<{
            name: string;
            hexColor: string;
            description: string;
          }>;
        }>
      )
        .map((color) =>
          color.swatches
            .map(
              (swatch) =>
                `${swatch.name}: ${swatch.hexColor}, ${swatch.description}`
            )
            .join(", ")
        )
        .join(", ")}`;
    }

    if (typography.length > 0) {
      userPrompt += `\n\nTypography:\n${(
        typography as Array<{
          styles: Array<{
            name: string;
            description: string;
            fontFamily: string;
            fontWeight: string;
            fontSize: string;
            lineHeight: string;
          }>;
        }>
      )
        .map((typo) =>
          typo.styles
            .map(
              (style) =>
                `${style.name}: ${style.description}, ${style.fontFamily}, ${style.fontWeight}, ${style.fontSize}, ${style.lineHeight}`
            )
            .join(", ")
        )
        .join(", ")}`;
    }

    if (imageUrls.length > 0) {
      userPrompt += `\n\nINSPIRATION SOURCES:\nWe have attached some inspiration images as additional visual inputs. You MUST extract the design aesthetic (including color palettes, gradients, light/dark modes, background styles, borders, textures, button styling, fonts, and general UI/UX styling) from these inspiration images and apply/incorporate it in the redesigned UI.`;
    }

    userPrompt += `\n\nATTACHMENT ROLES:
- The first attached image is the wireframe/current snapshot (use it for visual context of the layout).
- Any additional attached images are style/theme inspiration images. You MUST redesign the UI's aesthetic to match the inspiration images.`;

    userPrompt += `\n\nReturn ONLY the complete HTML – no markdown fences, no explanations, no code blocks. Begin now:`;

    // Build content parts – handle wireframe snapshot (base64 string → Uint8Array)
    const contentParts: any[] = [{ type: "text", text: userPrompt }];

    if (wireframeSnapshot) {
      try {
        const base64Data = wireframeSnapshot.includes(",")
          ? wireframeSnapshot.split(",")[1]
          : wireframeSnapshot;
        const binaryStr = atob(base64Data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        contentParts.push({ type: "image", image: bytes, mimeType: "image/png" });
      } catch {
        console.warn("[redesign] Failed to parse wireframe snapshot, skipping image");
      }
    }

    // Fetch and add inspiration images as binary content parts
    for (const url of imageUrls.slice(0, 2)) {
      try {
        console.log(`[redesign] Fetching inspiration image for Gemini: ${url}`)
        const fetched = await fetchImageAsUint8Array(url)
        if (fetched) {
          contentParts.push({
            type: "image",
            image: fetched.data,
            mimeType: fetched.mimeType,
          })
          console.log(`[redesign] Added inspiration image to contentParts. Type: ${fetched.mimeType}`)
        }
      } catch (err) {
        console.error(`[redesign] Failed to load inspiration image: ${url}`, err)
      }
    }

    const result = streamText({
      model: getAIModel() as any,
      messages: [{ role: "user", content: contentParts }],
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
    console.error("Redesign API error:", error);
    return NextResponse.json(
      {
        error: "Failed to process redesign request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
