import Razorpay from "razorpay";
import crypto from "crypto";
import { asyncHandler } from "../middlewares/error.js";



const razorpay = new Razorpay({
  key_id: "rzp_test_H3dRMlyt954d2B",
  key_secret: "pVb1TwmyhM0fphTKFY6YSeoC",
});

export const createPaymentIntent = asyncHandler(async (req, res, next) => {
  const { amount } = req.body;

  try {
    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "order_rcptid_11",
    };

    const paymentIntent = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      id: paymentIntent.id,
      amount: paymentIntent.amount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export const verifyPayment = asyncHandler(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  try {
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const generated_signature = crypto
      .createHmac("sha256", "pVb1TwmyhM0fphTKFY6YSeoC")
      .update(body)
      .digest("hex");

    if (generated_signature === razorpay_signature) {

      res.status(200).json({
        success: true,
        message: "Payment verification successful",
      });
    } else {

      res.status(400).json({
        success: false,
        message: "Payment verification failed. Invalid signature.",
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
