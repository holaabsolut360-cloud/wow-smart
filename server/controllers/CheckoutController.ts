import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/requireAuth";
import { getPreferredClient } from "../db/supabaseClient";
import { buildContainer } from "../container";
import { StorageValidationError } from "../services/StorageService";

export class CheckoutController {
  /**
   * POST /api/checkout/submit-payment
   * body: {
   *   companyId, plan, method, reference?,
   *   proofFile?: { base64Data, mimeType, fileName? }
   * }
   *
   * The proof file (if present) is expected as a base64 string WITHOUT the
   * `data:<mime>;base64,` prefix -- the frontend strips it before sending.
   */
  static async submitPayment(req: AuthenticatedRequest, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { companyId, plan, method, reference, proofFile } = req.body as {
      companyId?: string;
      plan?: "Emprendedor" | "Negocio" | "Empresa";
      method?: string;
      reference?: string;
      proofFile?: { base64Data: string; mimeType: string; fileName?: string };
    };

    if (!companyId || !plan || !method) {
      return res.status(400).json({ error: "companyId, plan and method are required" });
    }

    const client = getPreferredClient(req.headers.authorization);
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { paymentService } = buildContainer(client);

    try {
      const payment = await paymentService.submitPayment({
        companyId,
        plan,
        method,
        reference,
        proofFile,
        customerEmail: user.email,
        actorUserId: user.id,
      });
      return res.json(payment);
    } catch (err: any) {
      if (err instanceof StorageValidationError) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: err.message });
    }
  }
}
