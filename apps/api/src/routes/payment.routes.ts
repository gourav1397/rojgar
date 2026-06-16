import { Router } from "express";
import { prisma, UserRole } from "@rogjar/database";
import { paymentOrderSchema } from "@rogjar/shared";
import { audit } from "../middleware/audit";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { createRazorpayOrder } from "../services/payment.service";
import { asyncHandler } from "../utils/async-handler";

export const paymentRouter = Router();
paymentRouter.use(authenticate, authorize(UserRole.EMPLOYER, UserRole.ADMIN));

paymentRouter.post("/orders", validateBody(paymentOrderSchema), audit("payment.order.create", "Payment"), asyncHandler(async (request, response) => {
  const amountPaise = request.body.purpose === "FEATURED_JOB" ? 199900 : request.body.purpose === "PREMIUM_LISTING" ? 99900 : 499900;
  const order = await createRazorpayOrder({ amountPaise, receipt: `rogjar_${Date.now()}`, notes: { purpose: request.body.purpose } });
  const payment = await prisma.payment.create({
    data: {
      jobId: request.body.jobId,
      razorpayOrderId: order.id,
      amountPaise,
      purpose: request.body.purpose,
    },
  });
  response.status(201).json({ order, payment });
}));

paymentRouter.post("/webhook", audit("payment.webhook", "Payment"), asyncHandler(async (request, response) => {
  const orderId = request.body.payload?.payment?.entity?.order_id || request.body.razorpayOrderId;
  const paymentId = request.body.payload?.payment?.entity?.id || request.body.razorpayPaymentId;
  if (orderId) {
    await prisma.payment.updateMany({
      where: { razorpayOrderId: orderId },
      data: { razorpayPaymentId: paymentId, status: "CAPTURED" },
    });
  }
  response.json({ ok: true });
}));
