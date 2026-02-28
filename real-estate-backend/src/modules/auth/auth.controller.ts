import { Request, Response } from "express";
import { loginUser, refreshTokens, logoutUser } from "./auth.service.js";

const COOKIE_NAME = "refreshToken";
const COOKIE_OPTIONS = {
  httpOnly: true,       // JS cannot read it
  secure: process.env.NODE_ENV === "production",  // HTTPS only in prod
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: "/api/auth",   // Only sent on auth routes
};

// POST /api/auth/login
export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const result = await loginUser(username, password);

    res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);

    res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
}

// POST /api/auth/refresh
export async function refresh(req: Request, res: Response) {
  try {
    const rawToken = req.cookies?.[COOKIE_NAME];
    if (!rawToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const result = await refreshTokens(rawToken);

    // Rotate cookie
    res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);

    res.json({ accessToken: result.accessToken });
  } catch (error: any) {
    // On reuse detection, also clear the cookie
    res.clearCookie(COOKIE_NAME, { path: "/api/auth" });
    res.status(401).json({ message: error.message });
  }
}

// POST /api/auth/logout
export async function logout(req: Request, res: Response) {
  try {
    const rawToken = req.cookies?.[COOKIE_NAME];
    if (rawToken) {
      await logoutUser(rawToken);
    }
    res.clearCookie(COOKIE_NAME, { path: "/api/auth" });
    res.json({ message: "Logged out successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
