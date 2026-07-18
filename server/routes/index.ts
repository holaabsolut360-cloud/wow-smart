import { Express } from "express";
import { onboardingRoutes } from "./onboarding.routes";
import { checkoutRoutes } from "./checkout.routes";
import { subscriptionAdminRoutes } from "./subscription.routes";
import { cronRoutes } from "./cron.routes";
import { plansRoutes } from "./plans.routes";
import { paymentProofRoutes } from "./paymentProof.routes";

/**
 * Mounts every route built on the new layered architecture
 * (Routes -> Controllers -> Services -> Repositories).
 *
 * New features (subscriptions, payments, feature flags, cron) should be
 * added as a new `*.routes.ts` file here rather than growing server.ts.
 * This is intentionally mounted BEFORE the legacy authMiddleware in
 * server.ts for the routes that manage their own auth (cron secret,
 * SuperAdmin cookie), and it reuses `requireAuth` for the ones that need a
 * logged-in user.
 *
 * IMPORTANT: `requireAuth` is applied per-route INSIDE each *.routes.ts
 * file (e.g. `onboardingRoutes.post("/onboarding", requireAuth, ...)`),
 * never as a blanket middleware on `app.use("/api", requireAuth, router)`.
 * Express runs middleware passed to `app.use(path, ...)` for every request
 * matching that path prefix, regardless of which router ends up handling
 * it -- so a blanket call here would gate ALL routes mounted under "/api"
 * (including the public plans endpoint and the cron endpoint, which have
 * their own auth) behind a Supabase bearer token.
 */
export function mountSaasRoutes(app: Express) {
  app.use("/api", onboardingRoutes);
  app.use("/api", checkoutRoutes);
  app.use("/api", plansRoutes);
  app.use("/api", subscriptionAdminRoutes);
  app.use("/api", cronRoutes);
  app.use("/api", paymentProofRoutes);
}
