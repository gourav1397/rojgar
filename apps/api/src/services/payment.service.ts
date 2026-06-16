import Razorpay from "razorpay";
import { env } from "../config/env";

const razorpay =
  env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET
    ? new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET })
    : null;

export async function createRazorpayOrder(input: { amountPaise: number; receipt: string; notes?: Record<string, string> }) {
  if (!razorpay) {
    return {
      id: `order_dev_${Date.now()}`,
      amount: input.amountPaise,
      currency: "INR",
      receipt: input.receipt,
      status: "created",
    };
  }
  return razorpay.orders.create({
    amount: input.amountPaise,
    currency: "INR",
    receipt: input.receipt,
    notes: input.notes,
  });
}
