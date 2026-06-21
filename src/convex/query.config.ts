/* eslint-disable @typescript-eslint/no-explicit-any */
import { preloadQuery, fetchMutation } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { Id } from "../../convex/_generated/dataModel";
import { ConvexUserRaw, normalizeProfile } from "@/types/user";

export const ProfileQuery = async () => {
  return await preloadQuery(
    api.user.getCurrentUser,
    {},
    { token: await convexAuthNextjsToken() }
  );
};

export const ProjectsQuery = async () => {
  const rawProfile = await ProfileQuery();
  const profile = normalizeProfile(
    rawProfile._valueJSON as unknown as ConvexUserRaw | null
  );

  if (!profile?.id) {
    return { projects: null, profile: null };
  }

  const projects = await preloadQuery(
    api.projects.getUserProjects,
    { userId: profile.id as Id<"users"> },
    { token: await convexAuthNextjsToken() }
  );

  return { projects, profile };
};

export const ProjectQuery = async (projectId: string) => {
  const rawProfile = await ProfileQuery();
  const profile = normalizeProfile(
    rawProfile._valueJSON as unknown as ConvexUserRaw | null
  );

  if (!profile?.id || !projectId || projectId === "null") {
    return { project: null, profile: null };
  }

  const project = await preloadQuery(
    api.projects.getProject,
    { projectId: projectId as Id<"projects"> },
    { token: await convexAuthNextjsToken() }
  );

  return { project, profile };
};

export const StyleGuideQuery = async (projectId: string) => {
  if (!projectId || projectId === "null") {
    return { styleGuide: null };
  }

  const styleGuide = await preloadQuery(
    api.projects.getProjectStyleGuide,
    { projectId: projectId as Id<"projects"> },
    { token: await convexAuthNextjsToken() }
  );

  return { styleGuide };
};

export const MoodBoardImagesQuery = async (projectId: string) => {
  if (!projectId || projectId === "null") {
    return { images: null };
  }

  const images = await preloadQuery(
    api.moodboard.getMoodBoardImages,
    { projectId: projectId as Id<"projects"> },
    { token: await convexAuthNextjsToken() }
  );

  return { images };
};

export const InspirationImagesQuery = async (projectId: string) => {
  if (!projectId || projectId === "null") {
    return { images: null };
  }

  const images = await preloadQuery(
    api.inspiration.getInspirationImages,
    { projectId: projectId as Id<"projects"> },
    { token: await convexAuthNextjsToken() }
  );

  return { images };
};

export const UpdateProjectSketchesMutation = async ({
  projectId,
  sketchesData,
  viewportData,
}: {
  projectId: string;
  sketchesData: any;
  viewportData?: any;
}) => {
  return await fetchMutation(
    api.projects.updateProjectSketches,
    {
      projectId: projectId as Id<"projects">,
      sketchesData,
      viewportData,
    },
    { token: await convexAuthNextjsToken() }
  );
};
