import { Router } from "express";
import { FeatureController } from "../controllers/FeatureController";

export const plansRoutes = Router();

plansRoutes.get("/plans/:plan/features", FeatureController.getFeaturesForPlan);
