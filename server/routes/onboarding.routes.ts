import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { OnboardingController } from "../controllers/OnboardingController";

export const onboardingRoutes = Router();

onboardingRoutes.post("/onboarding", requireAuth, OnboardingController.createCompany);
