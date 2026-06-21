import { ProfileQuery } from "@/convex/query.config";
import { redirect } from "next/navigation";
import { combinedSlug } from "@/lib/utils";
import { ConvexUserRaw, normalizeProfile } from "@/types/user";

export const dynamic = "force-dynamic";

const Page = async () => {
  const rawProfile = await ProfileQuery();
  const profile = normalizeProfile(
    rawProfile._valueJSON as unknown as ConvexUserRaw | null
  );

  const profileName = profile?.name || "user";
  redirect(`/dashboard/${combinedSlug(profileName)}`);
};

export default Page;
