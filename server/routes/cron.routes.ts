import { Router } from "express";
import { requireCronSecret } from "../middleware/requireCronSecret";
import { CronController } from "../controllers/CronController";

export const cronRoutes = Router();

cronRoutes.post("/cron/check-trials", requireCronSecret, CronController.checkTrials);
