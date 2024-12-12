import { Router } from "express";
import { createOrder } from "../controllers/order.controller.js";
import { isAuthenticated } from "../middlewares/authentication.js";

const router = Router();
router.use(isAuthenticated);
router.post("/create", createOrder);

export default router;
