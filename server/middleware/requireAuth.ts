import { Request, Response, NextFunction } from "express";
import { getUserClient } from "../db/supabaseClient";

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email?: string };
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Unauthorized: No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized: Invalid token format" });

  const client = getUserClient(authHeader);
  if (!client) return res.status(503).json({ error: "Authentication is not configured" });

  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: "Unauthorized: Invalid token" });

  req.user = { id: data.user.id, email: data.user.email };
  next();
}
