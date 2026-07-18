import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { CheckoutController } from "../controllers/CheckoutController";

export const checkoutRoutes = Router();

checkoutRoutes.post("/checkout/submit-payment", requireAuth, CheckoutController.submitPayment);
