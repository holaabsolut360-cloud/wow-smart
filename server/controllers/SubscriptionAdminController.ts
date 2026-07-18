import { Request, Response } from "express";
import { buildAdminContainer } from "../container";
import { PaymentImmutableError } from "../services/PaymentService";

function handleError(err: any, res: Response) {
  if (err instanceof PaymentImmutableError) {
    return res.status(409).json({ error: err.message });
  }
  return res.status(500).json({ error: err.message });
}

export class SubscriptionAdminController {
  /** GET /api/superadmin/payments -- list payments awaiting review (Pendiente or En revisión). */
  static async listPending(_req: Request, res: Response) {
    try {
      const { paymentService } = buildAdminContainer();
      const payments = await paymentService.listPending();
      return res.json(payments);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /** POST /api/superadmin/payments/:id/start-review */
  static async startReview(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const { paymentService } = buildAdminContainer();
      const payment = await paymentService.startReview(id, "SuperAdmin");
      return res.json(payment);
    } catch (err: any) {
      return handleError(err, res);
    }
  }

  /** POST /api/superadmin/payments/:id/approve  body: { customerEmail } */
  static async approve(req: Request, res: Response) {
    const { id } = req.params;
    const { customerEmail } = req.body as { customerEmail?: string };

    if (!customerEmail) return res.status(400).json({ error: "customerEmail is required" });

    try {
      const { paymentService } = buildAdminContainer();
      const dashboardUrl = `${req.headers.origin || "https://wow-smart.com"}/dashboard`;
      const payment = await paymentService.approve(id, "SuperAdmin", customerEmail, dashboardUrl);
      return res.json(payment);
    } catch (err: any) {
      return handleError(err, res);
    }
  }

  /** POST /api/superadmin/payments/:id/reject  body: { customerEmail, reason } */
  static async reject(req: Request, res: Response) {
    const { id } = req.params;
    const { customerEmail, reason } = req.body as { customerEmail?: string; reason?: string };

    if (!customerEmail || !reason) {
      return res.status(400).json({ error: "customerEmail and reason are required" });
    }

    try {
      const { paymentService } = buildAdminContainer();
      const payment = await paymentService.reject(id, "SuperAdmin", reason, customerEmail);
      return res.json(payment);
    } catch (err: any) {
      return handleError(err, res);
    }
  }

  /** POST /api/superadmin/companies/:id/suspend  body: { reason } */
  static async suspend(req: Request, res: Response) {
    const { id } = req.params;
    const { reason } = req.body as { reason?: string };

    try {
      const { subscriptionService } = buildAdminContainer();
      const company = await subscriptionService.suspend(id, reason || "Suspendida por SuperAdmin");
      return res.json(company);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
