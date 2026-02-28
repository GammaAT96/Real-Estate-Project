import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../../config/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_DAYS = 7;

// ── Helpers ─────────────────────────────────────────────

function signAccessToken(userId: string, role: string, companyId: string | null) {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign({ userId, role, companyId }, JWT_SECRET, options);
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

function refreshTokenExpiry() {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);
  return d;
}

// ── Login ────────────────────────────────────────────────

export async function loginUser(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || !user.isActive) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const accessToken = signAccessToken(user.id, user.role, user.companyId);
  const rawRefreshToken = generateRefreshToken();

  // Persist refresh token
  await prisma.refreshToken.create({
    data: {
      token: rawRefreshToken,
      userId: user.id,
      companyId: user.companyId ?? null,
      expiresAt: refreshTokenExpiry(),
    },
  });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    user: { id: user.id, username: user.username, role: user.role },
  };
}

// ── Refresh (with reuse detection) ───────────────────────

export async function refreshTokens(rawToken: string) {
  const existing = await prisma.refreshToken.findUnique({
    where: { token: rawToken },
    include: { user: true },
  });

  // ── Reuse detection: token found but already revoked ──
  if (existing && !existing.isActive) {
    // Token family compromise — revoke ALL tokens for this user
    await prisma.refreshToken.updateMany({
      where: { userId: existing.userId },
      data: { isActive: false },
    });
    throw new Error("Refresh token reuse detected. All sessions revoked.");
  }

  if (!existing || existing.expiresAt < new Date()) {
    throw new Error("Invalid or expired refresh token");
  }

  if (!existing.user.isActive) throw new Error("User account is disabled");

  // Rotate: revoke old token
  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { isActive: false },
  });

  // Issue new pair
  const newAccessToken = signAccessToken(
    existing.userId,
    existing.user.role,
    existing.user.companyId
  );
  const newRawRefreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      token: newRawRefreshToken,
      userId: existing.userId,
      companyId: existing.companyId,
      expiresAt: refreshTokenExpiry(),
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRawRefreshToken,
  };
}

// ── Logout ────────────────────────────────────────────────

export async function logoutUser(rawToken: string) {
  await prisma.refreshToken.updateMany({
    where: { token: rawToken },
    data: { isActive: false },
  });
}
