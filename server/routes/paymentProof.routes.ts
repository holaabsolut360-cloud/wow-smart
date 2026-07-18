import { Router } from "express";
import { PaymentProofController } from "../controllers/PaymentProofController";

export const paymentProofRoutes = Router();

// No blanket auth middleware here on purpose: PaymentProofController checks
// for EITHER the SuperAdmin cookie OR a Supabase bearer token belonging to
// the payment's own company owner, and returns 403 otherwise.
paymentProofRoutes.get("/payments/:id/proof-url", PaymentProofController.getSignedUrl);
