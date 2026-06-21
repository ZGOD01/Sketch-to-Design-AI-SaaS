import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import {
  isBypassRoutes,
  isProtectedRoutes,
} from "./lib/permissions";
const ProtectedMatcher = createRouteMatcher(isProtectedRoutes);
const BypassMatcher = createRouteMatcher(isBypassRoutes);

export default convexAuthNextjsMiddleware(
  async (request, { convexAuth }) => {
    if (BypassMatcher(request)) return;

    const authed = await convexAuth.isAuthenticated();

    console.log(authed);

    // No auto-redirect to dashboard for authenticated users on public routes
    // This allows them to see the landing page even if logged in.

    if (ProtectedMatcher(request) && !authed) {
      return nextjsMiddlewareRedirect(request, `/auth/sign-in`);
    }

    return;
  },
  {
    cookieConfig: { maxAge: 60 * 60 * 24 * 30 },
  }
);

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
