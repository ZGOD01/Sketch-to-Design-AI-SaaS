import { NextRequest, NextResponse } from "next/server";
import { UpdateProjectSketchesMutation } from "@/convex/query.config";

interface UpdateProjectRequest {
  projectId: string;
  shapesData: {
    shapes: Record<string, unknown>;
    tool: string;
    selected: Record<string, unknown>;
    frameCounter: number;
  };
  viewportData?: {
    scale: number;
    translate: { x: number; y: number };
  };
}

export async function PATCH(request: NextRequest) {
  try {
    const body: UpdateProjectRequest & { userId?: string } =
      await request.json();
    const { projectId, shapesData, viewportData, userId } = body;

    if (!projectId || !userId || !shapesData) {
      return NextResponse.json(
        { error: "Project ID, User ID, and shapes data are required" },
        { status: 400 }
      );
    }

    // Call Convex mutation directly to save sketches synchronously and reliably
    await UpdateProjectSketchesMutation({
      projectId,
      sketchesData: shapesData,
      viewportData,
    });

    return NextResponse.json({
      success: true,
      message: "Project autosaved successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to autosave project",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
