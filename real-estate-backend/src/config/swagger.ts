import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Real Estate SaaS API",
            version: "1.0.0",
            description:
                "Multi-tenant Real Estate backend — manage companies, projects, plots, bookings and sales.",
        },
        servers: [
            { url: "http://localhost:5000", description: "Local Dev" },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "Paste the accessToken returned by POST /api/auth/login",
                },
            },
            schemas: {
                // ── Auth ─────────────────────────────────────
                LoginRequest: {
                    type: "object",
                    required: ["username", "password"],
                    properties: {
                        username: { type: "string", example: "superadmin" },
                        password: { type: "string", example: "admin123" },
                    },
                },
                LoginResponse: {
                    type: "object",
                    properties: {
                        accessToken: { type: "string" },
                        user: {
                            type: "object",
                            properties: {
                                id: { type: "string" },
                                username: { type: "string" },
                                role: { type: "string", enum: ["SUPER_ADMIN", "COMPANY_ADMIN", "AGENT"] },
                            },
                        },
                    },
                },
                // ── Company ──────────────────────────────────
                Company: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        isActive: { type: "boolean" },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },
                // ── Project ──────────────────────────────────
                Project: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        location: { type: "string" },
                        status: { type: "string", enum: ["ACTIVE", "INACTIVE"] },
                        isActive: { type: "boolean" },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },
                // ── Plot ─────────────────────────────────────
                Plot: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        plotNumber: { type: "string" },
                        area: { type: "number" },
                        price: { type: "number" },
                        status: { type: "string", enum: ["AVAILABLE", "BOOKED", "SOLD"] },
                        projectId: { type: "string" },
                        isActive: { type: "boolean" },
                    },
                },
                // ── Pagination ───────────────────────────────
                Pagination: {
                    type: "object",
                    properties: {
                        total: { type: "integer" },
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        totalPages: { type: "integer" },
                    },
                },
                // ── Error ────────────────────────────────────
                Error: {
                    type: "object",
                    properties: {
                        message: { type: "string" },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ["./src/modules/**/*.routes.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
