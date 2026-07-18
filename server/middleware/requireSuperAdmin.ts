import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

function getCookieValue(req: Request, name: string): string {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return "";

  return (
    cookieHeader
      .split(";")
      .map(cookie => cookie.trim())
      .find(cookie => cookie.startsWith(`${name}=`))
      ?.slice(name.length + 1) || ""
  );
}

/** Reusable check (no response side-effects) for controllers that need to
 * combine SuperAdmin access with another auth path (e.g. PaymentProofController,
 * which allows either the SuperAdmin OR the payment's own company owner). */
export function isSuperAdminRequest(req: Request): boolean {
  const token = getCookieValue(req, env.superAdminCookieName);
  return Boolean(env.superAdminSessionSecret && token === env.superAdminSessionSecret);
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!isSuperAdminRequest(req)) return res.status(401).json({ error: "Unauthorized" });
  next();
}
