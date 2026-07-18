import { Request, Response } from "express";
import { isSuperAdminRequest } from "../middleware/requireSuperAdmin";
import { getUserClient } from "../db/supabaseClient";
import { buildAdminContainer } from "../container";

/**
 * GET /api/payments/:id/proof-url
 *
 * Requirement #3 (seguridad): only the SuperAdmin or the owner of the
 * company that made the payment may view the proof. Since the bucket is
 * private, this is the ONLY way to get a usable link -- it mints a
 * short-lived signed URL on every call instead of exposing a permanent one.
 */
export class PaymentProofController {
  static async getSignedUrl(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const { paymentRepository, companyRepository, storageService } = buildAdminContainer();

      const payment = await paymentRepository.findById(id);
      if (!payment) return res.status(404).json({ error: "Payment not found" });
      if (!payment.proof_path) return res.status(404).json({ error: "This payment has no proof file" });

      const authorized = await PaymentProofController.isAuthorized(req, payment.company_id, companyRepository);
      if (!authorized) return res.status(403).json({ error: "Forbidden" });

      const url = await storageService.getSignedUrl(payment.proof_path);
      return res.json({ url, expiresIn: 300 });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  private static async isAuthorized(
    req: Request,
    companyId: string,
    companyRepository: ReturnType<typeof buildAdminContainer>["companyRepository"],
  ): Promise<boolean> {
    if (isSuperAdminRequest(req)) return true;

    const authHeader = req.headers.authorization;
    if (!authHeader) return false;

    const token = authHeader.split(" ")[1];
    if (!token) return false;

    const client = getUserClient(authHeader);
    if (!client) return false;

    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) return false;

    const company = await companyRepository.findById(companyId);
    return Boolean(company && company.user_id === data.user.id);
  }
}
