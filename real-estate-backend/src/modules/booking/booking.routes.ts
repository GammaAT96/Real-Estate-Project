import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import * as bookingController from "./booking.controller.js";
import { createBookingSchema, cancelBookingSchema } from "./booking.schema.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Plot booking management
 */

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     tags: [Bookings]
 *     summary: Create a booking for an available plot
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plotId, clientName, bookingAmount]
 *             properties:
 *               plotId:
 *                 type: string
 *                 format: uuid
 *               clientName:
 *                 type: string
 *                 example: Rahul Sharma
 *               bookingAmount:
 *                 type: number
 *                 example: 50000
 *     responses:
 *       201:
 *         description: Booking created, plot status → BOOKED
 *       400:
 *         description: Plot not available
 */
router.post("/", authenticate, authorizeRoles("COMPANY_ADMIN", "AGENT"), validate(createBookingSchema), bookingController.createBooking);

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   patch:
 *     tags: [Bookings]
 *     summary: Cancel a booking (plot reverts to AVAILABLE)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking cancelled
 *       404:
 *         description: Booking not found
 */
router.patch("/:id/cancel", authenticate, authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN", "AGENT"), validate(cancelBookingSchema), bookingController.cancelBooking);

export default router;
