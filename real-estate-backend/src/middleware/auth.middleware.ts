import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET!;

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    // Token is signed with `userId` — map it to `id` to match UserPayload
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: Role;
      companyId?: string;
    };

    req.user = {
      id: decoded.userId,
      role: decoded.role,
      companyId: decoded.companyId,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
