import { Router } from "express";
import {
  createPaymentIntent,
  verifyPayment,
} from "../controllers/payment.controller.js";

const router = Router();

router.post("/create-payment", createPaymentIntent);
router.post("/verify", verifyPayment);
export default router;
