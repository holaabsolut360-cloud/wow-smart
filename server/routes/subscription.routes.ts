import { Router } from "express";
import { requireSuperAdmin } from "../middleware/requireSuperAdmin";
import { SubscriptionAdminController } from "../controllers/SubscriptionAdminController";

export const subscriptionAdminRoutes = Router();

subscriptionAdminRoutes.get("/superadmin/payments", requireSuperAdmin, SubscriptionAdminController.listPending);
subscriptionAdminRoutes.post("/superadmin/payments/:id/start-review", requireSuperAdmin, SubscriptionAdminController.startReview);
subscriptionAdminRoutes.post("/superadmin/payments/:id/approve", requireSuperAdmin, SubscriptionAdminController.approve);
subscriptionAdminRoutes.post("/superadmin/payments/:id/reject", requireSuperAdmin, SubscriptionAdminController.reject);
subscriptionAdminRoutes.post("/superadmin/companies/:id/suspend", requireSuperAdmin, SubscriptionAdminController.suspend);
