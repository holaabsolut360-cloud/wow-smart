import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/requireAuth";
import { getPreferredClient } from "../db/supabaseClient";
import { buildContainer } from "../container";

function slugify(name: string): string {
  return (name || "mi-empresa").toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
}

export class OnboardingController {
  /**
   * POST /api/onboarding
   * Creates the company row and, when isTrial is requested, immediately
   * starts the 15-business-day free trial via SubscriptionService --
   * onboarding never touches subscription_status/subscription_ends_at
   * directly.
   */
  static async createCompany(req: AuthenticatedRequest, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { name, isTrial } = req.body as { name?: string; isTrial?: boolean };

    const client = getPreferredClient(req.headers.authorization);
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { companyRepository, subscriptionService } = buildContainer(client);

    try {
      const company = await companyRepository.insert({
        user_id: user.id,
        name: name || "Mi Nueva Empresa",
        slug: slugify(name || "mi-empresa"),
        plan: "Emprendedor",
        subscription_status: "Pendiente",
        business_type: "Restaurante",
        color: "#8b5cf6",
        whatsapp: "",
        logo: "",
        banner: "",
        instagram: "",
        facebook: "",
        email: user.email || null,
      });

      const finalCompany = isTrial
        ? await subscriptionService.startTrial(company.id, user.email)
        : company;

      return res.json({
        id: finalCompany.id,
        userId: finalCompany.user_id,
        name: finalCompany.name,
        slug: finalCompany.slug,
        plan: finalCompany.plan,
        subscriptionStatus: finalCompany.subscription_status,
        subscriptionEndsAt: finalCompany.subscription_ends_at,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
