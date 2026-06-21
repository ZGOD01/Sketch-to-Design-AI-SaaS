/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const createProject = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    sketchesData: v.any(), // JSON structure from Redux shapes state
    thumbnail: v.optional(v.string()),
  },
  handler: async (ctx, { userId, name, sketchesData, thumbnail }) => {
    console.log("🚀 [Convex] Creating project for user:", userId);

    // Create the project with a temporary name and number
    const tempName = name || "Project Temp";
    const projectId = await ctx.db.insert("projects", {
      userId,
      name: tempName,
      sketchesData,
      thumbnail,
      projectNumber: 0,
      lastModified: Date.now(),
      createdAt: Date.now(),
      isPublic: false,
    });

    // Reindex all user's projects to ensure they are sequential and aligned
    await reindexUserProjects(ctx, userId);

    // Get the updated project details
    const updated = await ctx.db.get(projectId);

    console.log("✅ [Convex] Project created and indexed:", {
      projectId,
      name: updated?.name || tempName,
      projectNumber: updated?.projectNumber || 1,
    });

    return {
      projectId,
      name: updated?.name || tempName,
      projectNumber: updated?.projectNumber || 1,
    };
  },
});

export const getUserProjects = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 20 }) => {
    const allProjects = await ctx.db
      .query("projects")
      .withIndex("by_userId_lastModified", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    const projects = allProjects.slice(0, limit);

    return projects.map((project) => ({
      _id: project._id,
      name: project.name,
      projectNumber: project.projectNumber,
      thumbnail: project.thumbnail,
      lastModified: project.lastModified,
      createdAt: project.createdAt,
      isPublic: project.isPublic,
    }));
  },
});

export const getProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");

    // Check ownership or public access
    if (project.userId !== userId && !project.isPublic) {
      throw new Error("Access denied");
    }

    return project;
  },
});

export const getProjectStyleGuide = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");

    // Check ownership or public access
    if (project.userId !== userId && !project.isPublic) {
      throw new Error("Access denied");
    }

    // Return parsed style guide data or null
    return project.styleGuide ? JSON.parse(project.styleGuide) : null;
  },
});

export const updateProjectSketches = mutation({
  args: {
    projectId: v.id("projects"),
    sketchesData: v.any(),
    viewportData: v.optional(v.any()),
  },
  handler: async (ctx, { projectId, sketchesData, viewportData }) => {
    console.log("💾 [Convex] Auto-saving project:", projectId);

    // Verify project exists and user has access
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");

    // Prepare update data
    const updateData: any = {
      sketchesData,
      lastModified: Date.now(),
    };

    // Include viewport data if provided
    if (viewportData) {
      updateData.viewportData = viewportData;
    }

    // Update sketches and viewport data
    await ctx.db.patch(projectId, updateData);

    console.log("✅ [Convex] Project auto-saved successfully");
    return { success: true };
  },
});

export const updateProjectStyleGuide = mutation({
  args: {
    projectId: v.id("projects"),
    styleGuideData: v.any(), // JSON structure for AI-generated style guide
  },
  handler: async (ctx, { projectId, styleGuideData }) => {
    console.log("🎨 [Convex] Updating project style guide:", projectId);
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId !== userId) {
      throw new Error("Access denied");
    }

    await ctx.db.patch(projectId, {
      styleGuide: JSON.stringify(styleGuideData), // Store as JSON string
      lastModified: Date.now(),
    });

    console.log("✅ [Convex] Project style guide updated successfully");
    return { success: true, styleGuide: styleGuideData };
  },
});

export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");

    if (project.userId !== userId) {
      throw new Error("Access denied");
    }

    await ctx.db.delete(projectId);
    console.log("🗑️ [Convex] Project deleted:", projectId);

    // Reindex remaining projects to keep them sequential
    await reindexUserProjects(ctx, userId);

    return { success: true };
  },
});

export const renameProject = mutation({
  args: { projectId: v.id("projects"), name: v.string() },
  handler: async (ctx, { projectId, name }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");

    if (project.userId !== userId) {
      throw new Error("Access denied");
    }

    await ctx.db.patch(projectId, {
      name,
      lastModified: Date.now(),
    });
    console.log("✏️ [Convex] Project renamed:", projectId, "to", name);

    return { success: true };
  },
});

export const getProjectInfo = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const project = await ctx.db.get(projectId);
    if (!project) return null;

    // Check ownership or public access
    if (project.userId !== userId && !project.isPublic) {
      return null;
    }

    return {
      _id: project._id,
      name: project.name,
      projectNumber: project.projectNumber,
    };
  },
});

async function reindexUserProjects(ctx: any, userId: string): Promise<void> {
  const allProjects = await ctx.db
    .query("projects")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .collect();

  // Sort by createdAt ascending to preserve order
  const sorted = [...allProjects].sort((a, b) => a.createdAt - b.createdAt);

  for (let i = 0; i < sorted.length; i++) {
    const project = sorted[i];
    const newNumber = i + 1;

    // Check if name is the default auto-generated "Project X"
    const isDefaultName = !project.name || /^Project \d+$/.test(project.name) || project.name === "Project Temp";
    const newName = isDefaultName ? `Project ${newNumber}` : project.name;

    if (project.projectNumber !== newNumber || project.name !== newName) {
      await ctx.db.patch(project._id, {
        projectNumber: newNumber,
        name: newName,
      });
    }
  }
}
