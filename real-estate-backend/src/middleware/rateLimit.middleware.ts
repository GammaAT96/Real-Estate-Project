import rateLimit from "express-rate-limit";

/**
 * Strict rate limiter for login — 10 attempts per 15 minutes per IP.
 * After 10 failures, returns 429 Too Many Requests.
 */
export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,                   // max 10 attempts per window
    standardHeaders: true,     // Return rate limit info in RateLimit-* headers
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login attempts. Please try again after 15 minutes.",
    },
    skipSuccessfulRequests: true, // Only count failed attempts (non-2xx)
});

/**
 * General API limiter — 300 requests per 15 minutes per IP.
 * Protects all other routes from abuse.
 */
export const generalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please slow down.",
    },
});
